import type { PermissionOverrideRepository } from "~context/infrastructure/repositories/permission-override.repository";
import type { PermissionRepository } from "~context/infrastructure/repositories/permission.repository";
import type { PermissionOverrideService } from "~context/domain/services/permission-override.service";
import type { RealmRepository } from "~context/infrastructure/repositories/realm.repository";

declare global {
    namespace Integration {
        namespace Domain {
            namespace PermissionOverride {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly seedSystemRealm: SeedSystemRealm.Signature;
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly permissionOverrideService: PermissionOverrideService;
                        readonly repositories: Repositories.Context;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
                }

                namespace Repositories {
                    type Context = {
                        readonly permissionOverrides: PermissionOverrideRepository;
                        readonly permissions: PermissionRepository;
                        readonly realms: RealmRepository;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
                }

                namespace Config {
                    type Props = {
                        readonly overrideLimit?: number;
                    };
                }

                namespace SeedSystemRealm {
                    type Props = Suite;

                    type Result = Promise<Entities.Realm>;

                    type Signature = (suite: Props) => Result;
                }
            }
        }
    }
}
