import { jest } from "@jest/globals";

import { PermissionQueries } from "~context/application/queries/permission.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class PermissionQueriesUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Application.PermissionQueries.Contract
{
    public queries(): Unit.Application.PermissionQueries.Queries.Result {
        const repository = {
            findUniqueOrThrow: jest.fn<Repositories.Permission.QueryContract["findUniqueOrThrow"]>(),
            findMany: jest.fn<Repositories.Permission.QueryContract["findMany"]>(),
            findEffective: jest.fn<Repositories.Permission.QueryContract["findEffective"]>(),
            getLookupList: jest.fn<Repositories.Permission.QueryContract["getLookupList"]>(),
        };

        return {
            queries: new PermissionQueries(this.contract<Repositories.Permission.QueryContract>(repository)),
            repository,
        };
    }
}
