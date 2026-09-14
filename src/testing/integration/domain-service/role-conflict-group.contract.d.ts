import type { RoleConflictGroupRepository } from "~context/infrastructure/repositories/role-conflict-group.repository";
import type { RoleConflictGroupService } from "~context/domain/services/role-conflict-group.service";
import type { RealmRepository } from "~context/infrastructure/repositories/realm.repository";
import type { RoleRepository } from "~context/infrastructure/repositories/role.repository";

declare global {
    namespace Integration {
        namespace Domain {
            namespace RoleConflictGroup {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly roleConflictGroupService: RoleConflictGroupService;
                        readonly repositories: Repositories.Context;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
                }

                namespace Repositories {
                    type Context = {
                        readonly roleConflictGroups: RoleConflictGroupRepository;
                        readonly realms: RealmRepository;
                        readonly roles: RoleRepository;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
                }

                namespace Config {
                    type Props = {
                        readonly membersLimit?: number;
                        readonly groupLimit?: number;
                    };
                }
            }
        }
    }
}
