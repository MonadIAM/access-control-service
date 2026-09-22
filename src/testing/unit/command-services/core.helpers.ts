import { jest } from "@jest/globals";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class ApplicationCommandUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Commands.Core.Contract {
    public execution(): Unit.Commands.Core.Execution.Result {
        const transaction = this.transaction();

        const run = jest.fn<TransactionManager.Service.Run.Signature>(
            async <T extends TransactionManager.Service.ResultValue>(
                props: TransactionManager.Service.Run.Props<T>,
            ): TransactionManager.Service.Run.Result<T> => await props.execute(transaction.entityManager),
        );
        const consume = jest.fn<Unit.Commands.Core.Consume.Signature>(async (props) => ({
            value: props.execute ? await props.execute(transaction.entityManager) : undefined,
            status: "processed",
        }));

        return {
            transactional: this.contract<TransactionManager.Service.PublicContract>({ run, consume }),
            transaction,
            consume,
            run,
        };
    }
}
