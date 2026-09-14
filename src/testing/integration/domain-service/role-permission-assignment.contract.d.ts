import type { RolePermissionAssignmentRepository } from "~context/infrastructure/repositories/role-permission-assignment.repository";
import type { RolePermissionAssignmentService } from "~context/domain/services/role-permission-assignment.service";
import type { PermissionRepository } from "~context/infrastructure/repositories/permission.repository";
import type { RealmRepository } from "~context/infrastructure/repositories/realm.repository";
import type { RoleRepository } from "~context/infrastructure/repositories/role.repository";

declare global {
    namespace Integration {
        namespace Domain {
            namespace RolePermissionAssignment {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly seedSystemRealm: SeedSystemRealm.Signature;
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly rolePermissionAssignmentService: RolePermissionAssignmentService;
                        readonly repositories: Repositories.Context;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
                }

                namespace Repositories {
                    type Context = {
                        readonly rolePermissionAssignments: RolePermissionAssignmentRepository;
                        readonly permissions: PermissionRepository;
                        readonly realms: RealmRepository;
                        readonly roles: RoleRepository;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
                }

                namespace Config {
                    type Props = {
                        readonly permissionLimit?: number;
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
