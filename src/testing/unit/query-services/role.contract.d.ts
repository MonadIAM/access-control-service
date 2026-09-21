import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace RoleQueries {
                interface Contract extends Domain.Core.Contract {
                    readonly queries: Queries.Signature;
                }

                namespace Repository {
                    type Contract = {
                        readonly findUniqueOrThrow: jest.Mock<Repositories.Role.QueryContract["findUniqueOrThrow"]>;
                        readonly findMany: jest.Mock<Repositories.Role.QueryContract["findMany"]>;
                        readonly findAncestors: jest.Mock<Repositories.Role.QueryContract["findAncestors"]>;
                        readonly findDescendants: jest.Mock<Repositories.Role.QueryContract["findDescendants"]>;
                        readonly findDelegable: jest.Mock<Repositories.Role.QueryContract["findDelegable"]>;
                        readonly findEffective: jest.Mock<Repositories.Role.QueryContract["findEffective"]>;
                        readonly getLookupList: jest.Mock<Repositories.Role.QueryContract["getLookupList"]>;
                        readonly getHierarchyGraph: jest.Mock<Repositories.Role.QueryContract["getHierarchyGraph"]>;
                    };
                }

                namespace Queries {
                    type Result = {
                        readonly queries: globalThis.Queries.Role.Contract;
                        readonly repository: Repository.Contract;
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
