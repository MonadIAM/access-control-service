import { jest } from "@jest/globals";

import { PermissionQueries } from "~context/application/queries/permission.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class PermissionQueriesUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Queries.Permission.Contract {
    public queries(): Unit.Queries.Permission.Queries.Result {
        const repository = {
            findUniqueOrThrow: jest.fn<Repositories.Permission.QueryContract["findUniqueOrThrow"]>(),
            findMany: jest.fn<Repositories.Permission.QueryContract["findMany"]>(),
            findEffective: jest.fn<Repositories.Permission.QueryContract["findEffective"]>(),
            getLookupList: jest.fn<Repositories.Permission.QueryContract["getLookupList"]>(),
        };
        const cache = {
            collectPermissions: jest.fn<InfrastructureServices.ProjectionCache.CollectPermissions.Signature>(),
        };

        return {
            queries: new PermissionQueries(
                this.contract<InfrastructureServices.ProjectionCache.PublicContract>(cache),
                this.contract<Repositories.Permission.QueryContract>(repository),
            ),
            repository,
            cache,
        };
    }
}
