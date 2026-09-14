import type { PermissionRepository } from "~context/infrastructure/repositories/permission.repository";
import type { RealmRepository } from "~context/infrastructure/repositories/realm.repository";
import type { RealmService } from "~context/domain/services/realm.service";

declare global {
    namespace Integration {
        namespace Domain {
            namespace Realm {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly seedSystemPermissions: SeedSystemPermissions.Signature;
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly realmService: RealmService;
                        readonly repositories: Repositories.Context;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
                }

                namespace Repositories {
                    type Context = {
                        readonly permissions: PermissionRepository;
                        readonly realms: RealmRepository;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
                }

                namespace Config {
                    type Props = {
                        readonly realmLimit?: number;
                    };
                }

                namespace SeedSystemPermissions {
                    type Props = Suite;

                    type Result = Promise<Entities.Realm>;

                    type Signature = (suite: Props) => Result;
                }
            }
        }
    }
}
