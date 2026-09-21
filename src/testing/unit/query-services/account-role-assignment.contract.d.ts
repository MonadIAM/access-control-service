import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace AccountRoleAssignmentQueries {
                interface Contract extends Domain.Core.Contract {
                    readonly queries: Queries.Signature;
                }

                namespace Repository {
                    type Contract = {
                        readonly findUniqueOrThrow: jest.Mock<
                            Repositories.AccountRoleAssignment.QueryContract["findUniqueOrThrow"]
                        >;
                        readonly findMany: jest.Mock<Repositories.AccountRoleAssignment.QueryContract["findMany"]>;
                    };
                }

                namespace Queries {
                    type Result = {
                        readonly queries: globalThis.Queries.AccountRoleAssignment.Contract;
                        readonly repository: Repository.Contract;
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
