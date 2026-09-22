import { jest } from "@jest/globals";

import { PermissionOverrideQueries } from "~context/application/queries/permission-override.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class PermissionOverrideQueriesUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Queries.PermissionOverride.Contract
{
    public queries(): Unit.Queries.PermissionOverride.Queries.Result {
        const repository = {
            findUniqueOrThrow: jest.fn<Repositories.PermissionOverride.QueryContract["findUniqueOrThrow"]>(),
            findMany: jest.fn<Repositories.PermissionOverride.QueryContract["findMany"]>(),
        };

        return {
            queries: new PermissionOverrideQueries(
                this.contract<Repositories.PermissionOverride.QueryContract>(repository),
            ),
            repository,
        };
    }
}
