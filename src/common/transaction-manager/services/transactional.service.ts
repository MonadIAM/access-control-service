import { AnyEntity, EntityManager } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { AuditLogTopicAction } from "@monadiam/shared";
import { ConfigService } from "@nestjs/config";
import { Injectable } from "@nestjs/common";

import { ExceptionMapper } from "~common/exceptions";
import { KafkaTopic } from "~context/enums";

import { OperationContext } from "../utilities/operation-context";
import { ProjectionJournal, AuditLog, Outbox } from "../entities";

@Injectable()
export class TransactionalService {
    private readonly serviceName: string;

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        private readonly operationContext: OperationContext,
        private readonly configService: ConfigService,
    ) {
        this.serviceName = this.configService.getOrThrow<string>("SERVICE_NAME");
    }

    public async run<T extends AnyEntity | AnyEntity[]>(params: TransactionManager.Service.Run<T>): Promise<T | void> {
        try {
            const writeManager = this.writeManager.fork();

            if (params.audit) {
                const auditEntry = new AuditLog(params.audit);

                return await this.operationContext.run(
                    {
                        changeLogEnabled: params.changeLog ?? false,
                        auditEntry: auditEntry.id,
                    },
                    async () => {
                        return await writeManager.transactional(async (transaction) => {
                            transaction.persist(auditEntry);
                            transaction.persist(this.buildAuditLogArchiveOutbox(auditEntry));

                            return await this.executeWithEffects(params, transaction);
                        });
                    },
                );
            } else {
                return await writeManager.transactional(async (transaction) => {
                    return await this.executeWithEffects(params, transaction);
                });
            }
        } catch (error) {
            throw ExceptionMapper.fromORM(error, params.resource);
        }
    }

    private async executeWithEffects<T extends AnyEntity | AnyEntity[]>(
        params: TransactionManager.Service.Run<T>,
        transaction: EntityManager,
    ): Promise<T | void> {
        const result = await params.execute(transaction);

        if (result) {
            this.persistProjectionJournalEntries(params, transaction, result);
            this.persistOutboxEvents(params, transaction, result);
        }

        await transaction.flush();

        return result;
    }

    private persistOutboxEvents<T extends AnyEntity | AnyEntity[]>(
        params: TransactionManager.Service.Run<T>,
        transaction: EntityManager,
        result: T,
    ): void {
        if (params.outbox) {
            const entries = [params.outbox].flat();

            for (const { payloadMapper, ...outboxProps } of entries) {
                const payloads = payloadMapper ? [payloadMapper(result)].flat() : [result].flat();

                for (const payload of payloads) {
                    transaction.persist(new Outbox({ ...outboxProps, payload }));
                }
            }
        }
    }

    private persistProjectionJournalEntries<T extends AnyEntity | AnyEntity[]>(
        params: TransactionManager.Service.Run<T>,
        transaction: EntityManager,
        result: T,
    ): void {
        if (params.projectionJournal) {
            const entries = [params.projectionJournal].flat();

            for (const entry of entries) {
                const payloads = [entry.payloadMapper(result)].flat();

                for (const payload of payloads) {
                    transaction.persist(
                        new ProjectionJournal({
                            operationType: entry.operationType,
                            payload,
                        }),
                    );
                }
            }
        }
    }

    private buildAuditLogArchiveOutbox(auditEntry: AuditLog): Outbox {
        return new Outbox({
            destinationTopic: KafkaTopic.AUDIT_LOG_ARCHIVE,
            actionType: AuditLogTopicAction.ARCHIVE,
            payload: {
                id: auditEntry.id,
                service: this.serviceName,
                created_at: auditEntry.createdAt.toISOString(),
                action_type: auditEntry.actionType,
                entity_type: auditEntry.entityType,
                realm: auditEntry.realm ?? null,
                actor: auditEntry.actor,
                ip: auditEntry.ip ?? null,
                user_agent: auditEntry.userAgent ?? null,
                input: auditEntry.input ? JSON.stringify(auditEntry.input) : null,
            },
        });
    }
}
