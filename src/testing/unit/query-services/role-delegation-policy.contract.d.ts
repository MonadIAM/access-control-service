import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace RoleDelegationPolicyQueries {
                interface Contract extends Domain.Core.Contract {
                    readonly queries: Queries.Signature;
                }

                namespace Repository {
                    type Contract = {
                        readonly findUniqueOrThrow: jest.Mock<
                            Repositories.RoleDelegationPolicy.QueryContract["findUniqueOrThrow"]
                        >;
                        readonly findMany: jest.Mock<Repositories.RoleDelegationPolicy.QueryContract["findMany"]>;
                    };
                }

                namespace Queries {
                    type Result = {
                        readonly queries: globalThis.Queries.RoleDelegationPolicy.Contract;
                        readonly repository: Repository.Contract;
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
