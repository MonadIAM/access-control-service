import { jest } from "@jest/globals";

import { ChangeLogQueries } from "~context/application/queries/change-log.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class ChangeLogQueriesUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Application.ChangeLogQueries.Contract
{
    public queries(): Unit.Application.ChangeLogQueries.Queries.Result {
        const repository = {
            findUniqueOrThrow: jest.fn<Repositories.ChangeLog.QueryContract["findUniqueOrThrow"]>(),
            findMany: jest.fn<Repositories.ChangeLog.QueryContract["findMany"]>(),
        };

        return {
            queries: new ChangeLogQueries(this.contract<Repositories.ChangeLog.QueryContract>(repository)),
            repository,
        };
    }
}
