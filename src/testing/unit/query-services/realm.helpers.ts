import { jest } from "@jest/globals";

import { RealmQueries } from "~context/application/queries/realm.queries";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class RealmQueriesUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Queries.Realm.Contract {
    public queries(): Unit.Queries.Realm.Queries.Result {
        const repository: Unit.Queries.Realm.Queries.Result["repository"] = {
            findUniqueOrThrow: jest.fn<Repositories.Realm.QueryContract["findUniqueOrThrow"]>(),
            getLookupList: jest.fn<Repositories.Realm.GetLookupList.Signature>(),
            findMany: jest.fn<Repositories.Realm.QueryContract["findMany"]>(),
        };
        const cache = {
            collectRealms: jest.fn<InfrastructureServices.ProjectionCache.CollectRealms.Signature>(),
            checkRealm: jest.fn<InfrastructureServices.ProjectionCache.CheckRealm.Signature>(),
        };

        return {
            queries: new RealmQueries(
                this.contract<InfrastructureServices.ProjectionCache.PublicContract>(cache),
                this.contract<Repositories.Realm.QueryContract>(repository),
            ),
            repository,
            cache,
        };
    }
}
