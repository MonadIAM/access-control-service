import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace PermissionQueries {
                interface Contract extends Domain.Core.Contract {
                    readonly queries: Queries.Signature;
                }

                namespace Repository {
                    type Contract = {
                        readonly findUniqueOrThrow: jest.Mock<Repositories.Permission.QueryContract["findUniqueOrThrow"]>;
                        readonly findMany: jest.Mock<Repositories.Permission.QueryContract["findMany"]>;
                        readonly findEffective: jest.Mock<Repositories.Permission.QueryContract["findEffective"]>;
                        readonly getLookupList: jest.Mock<Repositories.Permission.QueryContract["getLookupList"]>;
                    };
                }

                namespace Queries {
                    type Result = {
                        readonly queries: globalThis.Queries.Permission.Contract;
                        readonly repository: Repository.Contract;
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
