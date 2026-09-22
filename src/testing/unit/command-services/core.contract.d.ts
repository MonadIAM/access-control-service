declare namespace Unit.Commands.Core {
    interface Contract extends Domain.Core.Contract {
        execution: Execution.Signature;
    }

    namespace Execution {
        type Result = {
            transaction: Domain.Core.Transaction;
            transactional: globalThis.TransactionManager.Service.PublicContract;
            run: Jest.Mock<globalThis.TransactionManager.Service.Run.Signature>;
            consume: Jest.Mock<Consume.Signature>;
        };

        type Signature = () => Result;
    }

    namespace Consume {
        type Props = globalThis.TransactionManager.Service.Consume.Props<globalThis.TransactionManager.Service.ResultValue>;

        type Result =
            globalThis.TransactionManager.Service.Consume.Result<globalThis.TransactionManager.Service.ResultValue>;

        type Signature = (props: Props) => Result;
    }
}
