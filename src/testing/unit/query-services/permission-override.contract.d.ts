import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace PermissionOverrideQueries {
                interface Contract extends Domain.Core.Contract {
                    readonly queries: Queries.Signature;
                }

                namespace Repository {
                    type Contract = {
                        readonly findUniqueOrThrow: jest.Mock<
                            Repositories.PermissionOverride.QueryContract["findUniqueOrThrow"]
                        >;
                        readonly findMany: jest.Mock<Repositories.PermissionOverride.QueryContract["findMany"]>;
                    };
                }

                namespace Queries {
                    type Result = {
                        readonly queries: globalThis.Queries.PermissionOverride.Contract;
                        readonly repository: Repository.Contract;
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
