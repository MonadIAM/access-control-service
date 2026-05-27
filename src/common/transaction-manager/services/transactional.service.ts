import { AnyEntity, EntityManager } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable } from "@nestjs/common";

import { ServiceException } from "~common/exceptions";

import { OperationContext } from "../utilities/operation-context";
import { ProjectionJournal, AuditLog, Outbox } from "../entities";

@Injectable()
export class TransactionalService {
    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        private readonly operationContext: OperationContext,
    ) {}

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
            throw ServiceException.fromOrmError(error, params.resource);
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
            const { payloadMapper, ...outboxProps } = params.outbox;
            const payloads = payloadMapper ? [payloadMapper(result)].flat() : [result].flat();

            for (const payload of payloads) {
                transaction.persist(new Outbox({ ...outboxProps, payload }));
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
}
