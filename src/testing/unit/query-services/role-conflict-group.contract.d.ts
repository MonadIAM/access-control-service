declare namespace Unit.Queries.RoleConflictGroup {
    interface Contract extends Domain.Core.Contract {
        queries: Queries.Signature;
    }

    namespace Repository {
        type Contract = {
            findAccountsViolatingRule: Jest.Mock<Repositories.RoleConflictGroup.QueryContract["findAccountsViolatingRule"]>;
            findUniqueOrThrow: Jest.Mock<Repositories.RoleConflictGroup.QueryContract["findUniqueOrThrow"]>;
            findMany: Jest.Mock<Repositories.RoleConflictGroup.QueryContract["findMany"]>;
            findGroupsViolatedByAccount: Jest.Mock<
                Repositories.RoleConflictGroup.QueryContract["findGroupsViolatedByAccount"]
            >;
        };
    }

    namespace Queries {
        type Result = {
            queries: globalThis.Queries.RoleConflictGroup.Contract;
            repository: Repository.Contract;
        };

        type Signature = () => Result;
    }
}
