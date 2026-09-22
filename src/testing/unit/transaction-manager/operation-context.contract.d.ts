declare namespace Unit.TransactionManager.OperationContext {
    interface Contract extends Unit.Domain.Core.Contract {
        operationContext: OperationContextFactory.Signature;
    }

    namespace OperationContextFactory {
        type Result = import("~common/transaction-manager/utilities").OperationContext;

        type Signature = () => Result;
    }
}
