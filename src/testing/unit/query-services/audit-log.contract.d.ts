import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace AuditLogQueries {
                interface Contract extends Domain.Core.Contract {
                    readonly queries: Queries.Signature;
                }

                namespace Repository {
                    type Contract = {
                        readonly findUniqueOrThrow: jest.Mock<Repositories.AuditLog.QueryContract["findUniqueOrThrow"]>;
                        readonly findMany: jest.Mock<Repositories.AuditLog.QueryContract["findMany"]>;
                    };
                }

                namespace Queries {
                    type Result = {
                        readonly queries: globalThis.Queries.AuditLog.Contract;
                        readonly repository: Repository.Contract;
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
