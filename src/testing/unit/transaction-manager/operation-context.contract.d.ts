import type { OperationContext as OperationContextInstance } from "~common/transaction-manager/utilities";

declare global {
    namespace Unit {
        namespace TransactionManager {
            namespace OperationContext {
                interface Contract extends Unit.Domain.Core.Contract {
                    readonly operationContext: OperationContextFactory.Signature;
                }

                namespace OperationContextFactory {
                    type Result = OperationContextInstance;

                    type Signature = () => Result;
                }
            }
        }
    }
}
