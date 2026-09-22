import { jest } from "@jest/globals";

import { AccountRoleAssignmentQueries } from "~context/application/queries/account-role-assignment.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class AccountRoleAssignmentQueriesUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Queries.AccountRoleAssignment.Contract
{
    public queries(): Unit.Queries.AccountRoleAssignment.Queries.Result {
        const repository = {
            findUniqueOrThrow: jest.fn<Repositories.AccountRoleAssignment.QueryContract["findUniqueOrThrow"]>(),
            findMany: jest.fn<Repositories.AccountRoleAssignment.QueryContract["findMany"]>(),
        };

        return {
            queries: new AccountRoleAssignmentQueries(
                this.contract<Repositories.AccountRoleAssignment.QueryContract>(repository),
            ),
            repository,
        };
    }
}
