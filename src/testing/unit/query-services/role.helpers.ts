import { jest } from "@jest/globals";

import { RoleQueries } from "~context/application/queries/role.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class RoleQueriesUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Queries.Role.Contract {
    public queries(): Unit.Queries.Role.Queries.Result {
        const repository = {
            findUniqueOrThrow: jest.fn<Repositories.Role.QueryContract["findUniqueOrThrow"]>(),
            getHierarchyGraph: jest.fn<Repositories.Role.QueryContract["getHierarchyGraph"]>(),
            findDescendants: jest.fn<Repositories.Role.QueryContract["findDescendants"]>(),
            findAncestors: jest.fn<Repositories.Role.QueryContract["findAncestors"]>(),
            findDelegable: jest.fn<Repositories.Role.QueryContract["findDelegable"]>(),
            findEffective: jest.fn<Repositories.Role.QueryContract["findEffective"]>(),
            getLookupList: jest.fn<Repositories.Role.QueryContract["getLookupList"]>(),
            findMany: jest.fn<Repositories.Role.QueryContract["findMany"]>(),
        };

        return {
            queries: new RoleQueries(this.contract<Repositories.Role.QueryContract>(repository)),
            repository,
        };
    }
}
