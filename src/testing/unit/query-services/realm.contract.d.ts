import type { jest } from "@jest/globals";

declare global {
    namespace Unit {
        namespace Application {
            namespace RealmQueries {
                interface Contract extends Domain.Core.Contract {
                    readonly queries: Queries.Signature;
                }

                namespace Queries {
                    type Result = {
                        readonly queries: globalThis.Queries.Realm.Contract;
                        readonly repository: {
                            readonly findUniqueOrThrow: jest.Mock<Repositories.Realm.QueryContract["findUniqueOrThrow"]>;
                            readonly findMany: jest.Mock<Repositories.Realm.QueryContract["findMany"]>;
                            readonly getLookupList: jest.Mock<Repositories.Realm.GetLookupList.Signature>;
                        };
                        readonly cache: jest.Mocked<
                            Pick<InfrastructureServices.ProjectionCache.PublicContract, "checkRealm" | "collectRealms">
                        >;
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
