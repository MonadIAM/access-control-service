import type { OperationContext } from "~common/transaction-manager/utilities";

declare global {
    namespace Integration {
        namespace TransactionalHelper {
            interface Contract {
                createTransactionalServiceContext: CreateTransactionalServiceContext.Signature;
                createLogMaskingService: CreateLogMaskingService.Signature;
                expectNoTransactionRows: ExpectNoTransactionRows.Signature;
                createOutboxService: CreateOutboxService.Signature;
            }

            namespace CreateLogMaskingService {
                type Props = Partial<globalThis.TransactionManager.LogMasking.PublicContract>;

                type Result = globalThis.TransactionManager.LogMasking.Contract;

                type Signature = (overrides?: Props) => Result;
            }

            namespace CreateOutboxService {
                type Props = Partial<globalThis.TransactionManager.Outbox.Contract>;

                type Result = globalThis.TransactionManager.Outbox.Contract;

                type Signature = (overrides?: Props) => Result;
            }

            namespace CreateTransactionalServiceContext {
                type Props = {
                    readonly logMaskingService?: globalThis.TransactionManager.LogMasking.Contract;
                    readonly outboxService?: globalThis.TransactionManager.Outbox.Contract;
                    readonly orm: Postgres.Suite.FactoryContext["orm"];
                };

                type Result = {
                    readonly service: globalThis.TransactionManager.Service.PublicContract;
                    readonly orm: Postgres.Suite.FactoryContext["orm"];
                    readonly operationContext: OperationContext;
                    readonly readManager: ORM.EntityManager;
                };

                type Signature = (props: Props) => Result;
            }

            namespace ExpectNoTransactionRows {
                type Props = ORM.EntityManager;

                type Result = Promise<void>;

                type Signature = (readManager: Props) => Result;
            }
        }
    }
}
