import type { PermissionRepository } from "~context/infrastructure/repositories/permission.repository";
import type { RealmRepository } from "~context/infrastructure/repositories/realm.repository";
import type { PermissionService } from "~context/domain/services/permission.service";

declare global {
    namespace Integration {
        namespace Domain {
            namespace Permission {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly permissionService: PermissionService;
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
                        readonly permissionLimit?: number;
                    };
                }
            }
        }
    }
}
