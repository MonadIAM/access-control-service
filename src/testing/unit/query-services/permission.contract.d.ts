declare namespace Unit.Queries.Permission {
    interface Contract extends Domain.Core.Contract {
        queries: Queries.Signature;
    }

    namespace Repository {
        type Contract = {
            findUniqueOrThrow: Jest.Mock<Repositories.Permission.QueryContract["findUniqueOrThrow"]>;
            findEffective: Jest.Mock<Repositories.Permission.QueryContract["findEffective"]>;
            getLookupList: Jest.Mock<Repositories.Permission.QueryContract["getLookupList"]>;
            findMany: Jest.Mock<Repositories.Permission.QueryContract["findMany"]>;
        };
    }

    namespace Queries {
        type Result = {
            queries: globalThis.Queries.Permission.Contract;
            repository: Repository.Contract;
        };

        type Signature = () => Result;
    }
}
