declare namespace Unit.Queries.RolePermissionAssignment {
    interface Contract extends Domain.Core.Contract {
        queries: Queries.Signature;
    }

    namespace Repository {
        type Contract = {
            findUniqueOrThrow: Jest.Mock<Repositories.RolePermissionAssignment.QueryContract["findUniqueOrThrow"]>;
            findMany: Jest.Mock<Repositories.RolePermissionAssignment.QueryContract["findMany"]>;
        };
    }

    namespace Queries {
        type Result = {
            queries: globalThis.Queries.RolePermissionAssignment.Contract;
            repository: Repository.Contract;
        };

        type Signature = () => Result;
    }
}
