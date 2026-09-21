import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace RoleConflictGroupQueries {
                interface Contract extends Domain.Core.Contract {
                    readonly queries: Queries.Signature;
                }

                namespace Repository {
                    type Contract = {
                        readonly findUniqueOrThrow: jest.Mock<
                            Repositories.RoleConflictGroup.QueryContract["findUniqueOrThrow"]
                        >;
                        readonly findMany: jest.Mock<Repositories.RoleConflictGroup.QueryContract["findMany"]>;
                        readonly findGroupsViolatedByAccount: jest.Mock<
                            Repositories.RoleConflictGroup.QueryContract["findGroupsViolatedByAccount"]
                        >;
                        readonly findAccountsViolatingRule: jest.Mock<
                            Repositories.RoleConflictGroup.QueryContract["findAccountsViolatingRule"]
                        >;
                    };
                }

                namespace Queries {
                    type Result = {
                        readonly queries: globalThis.Queries.RoleConflictGroup.Contract;
                        readonly repository: Repository.Contract;
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
