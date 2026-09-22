declare namespace Unit.Queries.RoleDelegationPolicy {
    interface Contract extends Domain.Core.Contract {
        queries: Queries.Signature;
    }

    namespace Repository {
        type Contract = {
            findUniqueOrThrow: Jest.Mock<Repositories.RoleDelegationPolicy.QueryContract["findUniqueOrThrow"]>;
            findMany: Jest.Mock<Repositories.RoleDelegationPolicy.QueryContract["findMany"]>;
        };
    }

    namespace Queries {
        type Result = {
            queries: globalThis.Queries.RoleDelegationPolicy.Contract;
            repository: Repository.Contract;
        };

        type Signature = () => Result;
    }
}
