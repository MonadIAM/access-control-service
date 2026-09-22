declare namespace Unit.Queries.PermissionOverride {
    interface Contract extends Domain.Core.Contract {
        queries: Queries.Signature;
    }

    namespace Repository {
        type Contract = {
            findUniqueOrThrow: Jest.Mock<Repositories.PermissionOverride.QueryContract["findUniqueOrThrow"]>;
            findMany: Jest.Mock<Repositories.PermissionOverride.QueryContract["findMany"]>;
        };
    }

    namespace Queries {
        type Result = {
            queries: globalThis.Queries.PermissionOverride.Contract;
            repository: Repository.Contract;
        };

        type Signature = () => Result;
    }
}
