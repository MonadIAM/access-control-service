import { jest } from "@jest/globals";

import { AuditLogQueries } from "~context/application/queries/audit-log.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class AuditLogQueriesUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Application.AuditLogQueries.Contract
{
    public queries(): Unit.Application.AuditLogQueries.Queries.Result {
        const repository = {
            findUniqueOrThrow: jest.fn<Repositories.AuditLog.QueryContract["findUniqueOrThrow"]>(),
            findMany: jest.fn<Repositories.AuditLog.QueryContract["findMany"]>(),
        };

        return {
            queries: new AuditLogQueries(this.contract<Repositories.AuditLog.QueryContract>(repository)),
            repository,
        };
    }
}
