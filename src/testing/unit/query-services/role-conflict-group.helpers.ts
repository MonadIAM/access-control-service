import { jest } from "@jest/globals";

import { RoleConflictGroupQueries } from "~context/application/queries/role-conflict-group.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class RoleConflictGroupQueriesUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Application.RoleConflictGroupQueries.Contract
{
    public queries(): Unit.Application.RoleConflictGroupQueries.Queries.Result {
        const repository = {
            findUniqueOrThrow: jest.fn<Repositories.RoleConflictGroup.QueryContract["findUniqueOrThrow"]>(),
            findMany: jest.fn<Repositories.RoleConflictGroup.QueryContract["findMany"]>(),
            findGroupsViolatedByAccount:
                jest.fn<Repositories.RoleConflictGroup.QueryContract["findGroupsViolatedByAccount"]>(),
            findAccountsViolatingRule: jest.fn<Repositories.RoleConflictGroup.QueryContract["findAccountsViolatingRule"]>(),
        };

        return {
            queries: new RoleConflictGroupQueries(this.contract<Repositories.RoleConflictGroup.QueryContract>(repository)),
            repository,
        };
    }
}
