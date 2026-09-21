import { jest } from "@jest/globals";

import { RoleQueries } from "~context/application/queries/role.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class RoleQueriesUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Application.RoleQueries.Contract {
    public queries(): Unit.Application.RoleQueries.Queries.Result {
        const repository = {
            findUniqueOrThrow: jest.fn<Repositories.Role.QueryContract["findUniqueOrThrow"]>(),
            findMany: jest.fn<Repositories.Role.QueryContract["findMany"]>(),
            findAncestors: jest.fn<Repositories.Role.QueryContract["findAncestors"]>(),
            findDescendants: jest.fn<Repositories.Role.QueryContract["findDescendants"]>(),
            findDelegable: jest.fn<Repositories.Role.QueryContract["findDelegable"]>(),
            findEffective: jest.fn<Repositories.Role.QueryContract["findEffective"]>(),
            getLookupList: jest.fn<Repositories.Role.QueryContract["getLookupList"]>(),
            getHierarchyGraph: jest.fn<Repositories.Role.QueryContract["getHierarchyGraph"]>(),
        };

        return {
            queries: new RoleQueries(this.contract<Repositories.Role.QueryContract>(repository)),
            repository,
        };
    }
}
