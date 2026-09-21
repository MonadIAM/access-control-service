import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace RoleConflictMemberQueries {
                interface Contract extends Domain.Core.Contract {
                    readonly queries: Queries.Signature;
                }

                namespace Repository {
                    type Contract = {
                        readonly findUniqueOrThrow: jest.Mock<
                            Repositories.RoleConflictMember.QueryContract["findUniqueOrThrow"]
                        >;
                        readonly findMany: jest.Mock<Repositories.RoleConflictMember.QueryContract["findMany"]>;
                    };
                }

                namespace Queries {
                    type Result = {
                        readonly queries: globalThis.Queries.RoleConflictMember.Contract;
                        readonly repository: Repository.Contract;
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
