import { InjectEntityManager } from "@mikro-orm/nestjs";
import { AuditLogTopicAction } from "@monadiam/shared";
import { ConfigService } from "@nestjs/config";
import { Injectable, Inject } from "@nestjs/common";

import { ExceptionMapper } from "~common/exceptions";
import { KafkaTopic } from "~context/enums";

import { OperationContext } from "../utilities/operation-context";
import { AuditLog, Outbox } from "../entities";
import { LOG_MASKING_SERVICE } from "./tokens";

@Injectable()
export class TransactionalService implements TransactionManager.Service.Contract {
    private readonly serviceName: string;

    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: ORM.EntityManager,
        @Inject(LOG_MASKING_SERVICE)
        private readonly logMaskingService: TransactionManager.LogMasking.Contract,
        private readonly operationContext: OperationContext,
        private readonly configService: ConfigService,
    ) {
        this.serviceName = this.configService.getOrThrow<string>("SERVICE_NAME");
    }

    public async emit(params: TransactionManager.Service.Emit.Props): TransactionManager.Service.Emit.Result {
        try {
            const writeManager = this.writeManager.fork();
            const outbox = new Outbox(params);

            if (params.audit) {
                const entity = new AuditLog(params.audit);
                return await this.operationContext.run({ changeLogEnabled: false, auditEntry: entity.id }, () =>
                    writeManager.transactional(async (transaction) => {
                        if (entity.input) {
                            entity.input = await this.logMaskingService.maskAuditLog({ input: entity.input });
                        }

                        const hash = await this.logMaskingService.sign({ entity });
                        entity.sign(hash);

                        transaction.persist(entity);
                        transaction.persist(this.buildAuditLogArchiveOutbox(entity));
                        transaction.persist(outbox);
                        await transaction.flush();
                    }),
                );
            } else {
                return writeManager.transactional(async (transaction) => {
                    transaction.persist(outbox);
                    await transaction.flush();
                });
            }
        } catch (error) {
            throw ExceptionMapper.fromORM(error, params.resource);
        }
    }

    public async run<T extends ORM.AnyEntity | ORM.AnyEntity[]>(
        params: TransactionManager.Service.Run.Props<T>,
    ): TransactionManager.Service.Run.Result<T> {
        try {
            const writeManager = this.writeManager.fork();

            if (params.audit) {
                const entity = new AuditLog(params.audit);

                return await this.operationContext.run(
                    {
                        changeLogEnabled: params.changeLog ?? false,
                        auditEntry: entity.id,
                    },
                    async () => {
                        return await writeManager.transactional(async (transaction) => {
                            if (entity.input) {
                                entity.input = await this.logMaskingService.maskAuditLog({ input: entity.input });
                            }

                            const hash = await this.logMaskingService.sign({ entity });
                            entity.sign(hash);

                            transaction.persist(entity);
                            transaction.persist(this.buildAuditLogArchiveOutbox(entity));

                            return await this.executeWithEffects({ transaction, params });
                        });
                    },
                );
            } else {
                return await writeManager.transactional(async (transaction) => {
                    return await this.executeWithEffects({ transaction, params });
                });
            }
        } catch (error) {
            throw ExceptionMapper.fromORM(error, params.resource);
        }
    }

    public async executeWithEffects<T extends ORM.AnyEntity | ORM.AnyEntity[]>(
        props: TransactionManager.Service.ExecuteWithEffects.Props<T>,
    ): TransactionManager.Service.ExecuteWithEffects.Result<T> {
        const { transaction, params } = props;
        const result = await params.execute(transaction);

        if (result) {
            this.persistOutboxEvents({ transaction, params, result });
        }

        await transaction.flush();

        return result;
    }

    public persistOutboxEvents<T extends ORM.AnyEntity | ORM.AnyEntity[]>(
        props: TransactionManager.Service.PersistOutboxEvents.Props<T>,
    ): TransactionManager.Service.PersistOutboxEvents.Result {
        const { transaction, params, result } = props;
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

    public buildAuditLogArchiveOutbox(
        props: TransactionManager.Service.BuildAuditLogArchiveOutbox.Props,
    ): TransactionManager.Service.BuildAuditLogArchiveOutbox.Result {
        return new Outbox({
            destinationTopic: KafkaTopic.AUDIT_LOG_ARCHIVE,
            actionType: AuditLogTopicAction.ARCHIVE,
            payload: {
                input: props.input ? JSON.stringify(props.input) : null,
                created_at: props.createdAt.toISOString(),
                user_agent: props.userAgent ?? null,
                action_type: props.actionType,
                entity_type: props.entityType,
                realm: props.realm ?? null,
                service: this.serviceName,
                ip: props.ip ?? null,
                actor: props.actor,
                id: props.id,
            },
        });
    }
}
