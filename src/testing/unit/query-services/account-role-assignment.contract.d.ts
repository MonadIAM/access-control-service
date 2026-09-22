declare namespace Unit.Queries.AccountRoleAssignment {
    interface Contract extends Domain.Core.Contract {
        queries: Queries.Signature;
    }

    namespace Repository {
        type Contract = {
            findUniqueOrThrow: Jest.Mock<Repositories.AccountRoleAssignment.QueryContract["findUniqueOrThrow"]>;
            findMany: Jest.Mock<Repositories.AccountRoleAssignment.QueryContract["findMany"]>;
        };
    }

    namespace Queries {
        type Result = {
            queries: globalThis.Queries.AccountRoleAssignment.Contract;
            repository: Repository.Contract;
        };

        type Signature = () => Result;
    }
}
