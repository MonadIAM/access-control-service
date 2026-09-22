declare namespace Unit.Queries.RoleConflictMember {
    interface Contract extends Domain.Core.Contract {
        queries: Queries.Signature;
    }

    namespace Repository {
        type Contract = {
            findUniqueOrThrow: Jest.Mock<Repositories.RoleConflictMember.QueryContract["findUniqueOrThrow"]>;
            findMany: Jest.Mock<Repositories.RoleConflictMember.QueryContract["findMany"]>;
        };
    }

    namespace Queries {
        type Result = {
            queries: globalThis.Queries.RoleConflictMember.Contract;
            repository: Repository.Contract;
        };

        type Signature = () => Result;
    }
}
