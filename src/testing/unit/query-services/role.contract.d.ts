declare namespace Unit.Queries.Role {
    interface Contract extends Domain.Core.Contract {
        queries: Queries.Signature;
    }

    namespace Repository {
        type Contract = {
            findUniqueOrThrow: Jest.Mock<Repositories.Role.QueryContract["findUniqueOrThrow"]>;
            getHierarchyGraph: Jest.Mock<Repositories.Role.QueryContract["getHierarchyGraph"]>;
            findDescendants: Jest.Mock<Repositories.Role.QueryContract["findDescendants"]>;
            findAncestors: Jest.Mock<Repositories.Role.QueryContract["findAncestors"]>;
            findDelegable: Jest.Mock<Repositories.Role.QueryContract["findDelegable"]>;
            findEffective: Jest.Mock<Repositories.Role.QueryContract["findEffective"]>;
            getLookupList: Jest.Mock<Repositories.Role.QueryContract["getLookupList"]>;
            findMany: Jest.Mock<Repositories.Role.QueryContract["findMany"]>;
        };
    }

    namespace Queries {
        type Result = {
            queries: globalThis.Queries.Role.Contract;
            repository: Repository.Contract;
        };

        type Signature = () => Result;
    }
}
