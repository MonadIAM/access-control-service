import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace ChangeLogQueries {
                interface Contract extends Domain.Core.Contract {
                    readonly queries: Queries.Signature;
                }

                namespace Repository {
                    type Contract = {
                        readonly findUniqueOrThrow: jest.Mock<Repositories.ChangeLog.QueryContract["findUniqueOrThrow"]>;
                        readonly findMany: jest.Mock<Repositories.ChangeLog.QueryContract["findMany"]>;
                    };
                }

                namespace Queries {
                    type Result = {
                        readonly queries: globalThis.Queries.ChangeLog.Contract;
                        readonly repository: Repository.Contract;
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
