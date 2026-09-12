import { OperationContext } from "~common/transaction-manager/utilities";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class OperationContextUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.TransactionManager.OperationContext.Contract
{
    public operationContext(): Unit.TransactionManager.OperationContext.OperationContextFactory.Result {
        return new OperationContext();
    }
}
