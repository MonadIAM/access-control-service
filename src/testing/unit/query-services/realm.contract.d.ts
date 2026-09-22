declare namespace Unit.Queries.Realm {
    interface Contract extends Domain.Core.Contract {
        queries: Queries.Signature;
    }

    namespace Queries {
        type Result = {
            cache: Jest.Mocked<Pick<InfrastructureServices.ProjectionCache.PublicContract, "checkRealm" | "collectRealms">>;
            queries: globalThis.Queries.Realm.Contract;
            repository: {
                findUniqueOrThrow: Jest.Mock<Repositories.Realm.QueryContract["findUniqueOrThrow"]>;
                getLookupList: Jest.Mock<Repositories.Realm.GetLookupList.Signature>;
                findMany: Jest.Mock<Repositories.Realm.QueryContract["findMany"]>;
            };
        };

        type Signature = () => Result;
    }
}
