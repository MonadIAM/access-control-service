import type { jest } from "@jest/globals";

declare global {
    namespace Unit.Application.CommandCore {
        interface Contract extends Domain.Core.Contract {
            readonly execution: Execution.Signature;
        }

        namespace Execution {
            type Result = {
                readonly transaction: Domain.Core.Transaction;
                readonly transactional: globalThis.TransactionManager.Service.PublicContract;
                readonly run: jest.Mock<globalThis.TransactionManager.Service.Run.Signature>;
                readonly consume: jest.Mock<Consume.Signature>;
            };

            type Signature = () => Result;
        }

        namespace Consume {
            type Props =
                globalThis.TransactionManager.Service.Consume.Props<globalThis.TransactionManager.Service.ResultValue>;

            type Result =
                globalThis.TransactionManager.Service.Consume.Result<globalThis.TransactionManager.Service.ResultValue>;

            type Signature = (props: Props) => Result;
        }
    }
}
