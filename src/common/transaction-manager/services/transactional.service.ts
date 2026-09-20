import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Inject } from "@nestjs/common";

import { Exception, ExceptionMapper } from "~common/exceptions";

import { INBOX_SERVICE, LOG_MASKING_SERVICE, OUTBOX_SERVICE } from "./tokens";
import { OperationContext } from "../utilities";
import { AuditLog } from "../entities";

@Injectable()
export class TransactionalService implements TransactionManager.Service.Contract {
    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: ORM.EntityManager,
        @Inject(INBOX_SERVICE)
        private readonly inboxService: TransactionManager.Inbox.TransactionalContract,
        @Inject(LOG_MASKING_SERVICE)
        private readonly logMaskingService: TransactionManager.LogMasking.Contract,
        @Inject(OUTBOX_SERVICE)
        private readonly outboxService: TransactionManager.Outbox.Contract,
        private readonly operationContext: OperationContext,
    ) {}

    public async emit(params: TransactionManager.Service.Emit.Props): TransactionManager.Service.Emit.Result {
        try {
            const writeManager = this.writeManager.fork();
            return await writeManager.transactional(async (transaction) => {
                await this.emitTransaction({ transaction, params });
            });
        } catch (error) {
            if (error instanceof Exception) {
                throw error;
            } else {
                const mapped = ExceptionMapper.fromORM(error, params.resource);
                throw ExceptionMapper.isORM(mapped) ? mapped : error;
            }
        }
    }

    public async run<T extends TransactionManager.Service.ResultValue>(
        params: TransactionManager.Service.Run.Props<T>,
    ): TransactionManager.Service.Run.Result<T> {
        try {
            const writeManager = this.writeManager.fork();

            return await writeManager.transactional(async (transaction) => {
                return await this.executeTransaction({ transaction, params });
            });
        } catch (error) {
            if (error instanceof Exception) {
                throw error;
            } else {
                const mapped = ExceptionMapper.fromORM(error, params.resource);
                throw ExceptionMapper.isORM(mapped) ? mapped : error;
            }
        }
    }

    public async consume<T extends TransactionManager.Service.ResultValue>(
        params: TransactionManager.Service.Consume.Props<T>,
    ): TransactionManager.Service.Consume.Result<T | void> {
        try {
            const writeManager = this.writeManager.fork();

            return await writeManager.transactional(async (transaction) => {
                const claimed = await this.inboxService.claim({ transaction, incoming: params.incoming });
                if (claimed) {
                    if (params.execute) {
                        const value = await this.executeTransaction({ transaction, params });
                        return { status: "processed", value };
                    } else {
                        await this.emitTransaction({ transaction, params });
                        return { status: "processed", value: undefined };
                    }
                } else {
                    return { status: "duplicate" };
                }
            });
        } catch (error) {
            if (error instanceof Exception) {
                throw error;
            } else {
                const mapped = ExceptionMapper.fromORM(error, params.resource);
                throw ExceptionMapper.isORM(mapped) ? mapped : error;
            }
        }
    }

    public async emitTransaction(
        props: TransactionManager.Service.EmitTransaction.Props,
    ): TransactionManager.Service.EmitTransaction.Result {
        const { transaction, params } = props;
        const outbox = this.outboxService.build(params);
        const entity = new AuditLog(params.audit);

        await this.operationContext.run({ changeLogEnabled: false, auditEntry: entity.id }, async () => {
            if (entity.input) {
                entity.input = await this.logMaskingService.maskAuditLog({ input: entity.input });
            }

            const hash = await this.logMaskingService.sign({ entity });
            entity.sign(hash);

            transaction.persist(entity);
            transaction.persist(this.outboxService.buildAuditLogArchive(entity));
            transaction.persist(outbox);
            await transaction.flush();
        });
    }

    public async executeTransaction<T extends TransactionManager.Service.ResultValue>(
        props: TransactionManager.Service.ExecuteTransaction.Props<T>,
    ): TransactionManager.Service.ExecuteTransaction.Result<T> {
        const { transaction, params } = props;
        if (params.audit) {
            const entity = new AuditLog(params.audit);

            return await this.operationContext.run(
                {
                    changeLogEnabled: params.changeLog ?? false,
                    auditEntry: entity.id,
                },
                async () => {
                    if (entity.input) {
                        entity.input = await this.logMaskingService.maskAuditLog({ input: entity.input });
                    }

                    const hash = await this.logMaskingService.sign({ entity });
                    entity.sign(hash);

                    transaction.persist(entity);
                    transaction.persist(this.outboxService.buildAuditLogArchive(entity));

                    return await this.executeWithEffects({ transaction, params });
                },
            );
        } else {
            return await this.executeWithEffects({ transaction, params });
        }
    }

    public async executeWithEffects<T extends TransactionManager.Service.ResultValue>(
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

    public persistOutboxEvents<T extends TransactionManager.Service.ResultValue>(
        props: TransactionManager.Service.PersistOutboxEvents.Props<T>,
    ): TransactionManager.Service.PersistOutboxEvents.Result {
        const { transaction, params, result } = props;
        if (params.outbox) {
            const entries = [params.outbox].flat();

            for (const { payloadMapper, ...outboxProps } of entries) {
                const payloads = payloadMapper ? [payloadMapper(result)].flat() : [result].flat();

                for (const payload of payloads) {
                    transaction.persist(this.outboxService.build({ ...outboxProps, payload }));
                }
            }
        }
    }
}
