import type { OperationContext } from "~common/transaction-manager/utilities";

declare global {
    namespace Integration.TransactionalHelper {
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
                logMaskingService?: globalThis.TransactionManager.LogMasking.Contract;
                outboxService?: globalThis.TransactionManager.Outbox.Contract;
                orm: Postgres.Suite.FactoryContext["orm"];
            };

            type Result = {
                service: globalThis.TransactionManager.Service.PublicContract;
                orm: Postgres.Suite.FactoryContext["orm"];
                operationContext: OperationContext;
                readManager: ORM.EntityManager;
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
