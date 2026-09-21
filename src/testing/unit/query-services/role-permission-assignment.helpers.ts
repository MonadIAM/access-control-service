import { jest } from "@jest/globals";

import { RolePermissionAssignmentQueries } from "~context/application/queries/role-permission-assignment.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class RolePermissionAssignmentQueriesUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Application.RolePermissionAssignmentQueries.Contract
{
    public queries(): Unit.Application.RolePermissionAssignmentQueries.Queries.Result {
        const repository = {
            findUniqueOrThrow: jest.fn<Repositories.RolePermissionAssignment.QueryContract["findUniqueOrThrow"]>(),
            findMany: jest.fn<Repositories.RolePermissionAssignment.QueryContract["findMany"]>(),
        };

        return {
            queries: new RolePermissionAssignmentQueries(
                this.contract<Repositories.RolePermissionAssignment.QueryContract>(repository),
            ),
            repository,
        };
    }
}
