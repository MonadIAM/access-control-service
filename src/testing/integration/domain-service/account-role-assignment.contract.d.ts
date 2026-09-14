import type { AccountRoleAssignmentRepository } from "~context/infrastructure/repositories/account-role-assignment.repository";
import type { RoleDelegationPolicyRepository } from "~context/infrastructure/repositories/role-delegation-policy.repository";
import type { RoleConflictGroupRepository } from "~context/infrastructure/repositories/role-conflict-group.repository";
import type { AccountRoleAssignmentService } from "~context/domain/services/account-role-assignment.service";
import type { RealmRepository } from "~context/infrastructure/repositories/realm.repository";
import type { RoleRepository } from "~context/infrastructure/repositories/role.repository";

declare global {
    namespace Integration {
        namespace Domain {
            namespace AccountRoleAssignment {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly accountRoleAssignmentService: AccountRoleAssignmentService;
                        readonly repositories: Repositories.Context;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
                }

                namespace Repositories {
                    type Context = {
                        readonly accountRoleAssignments: AccountRoleAssignmentRepository;
                        readonly roleDelegationPolicies: RoleDelegationPolicyRepository;
                        readonly roleConflictGroups: RoleConflictGroupRepository;
                        readonly realms: RealmRepository;
                        readonly roles: RoleRepository;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
                }

                namespace Config {
                    type Props = {
                        readonly accountRoleLimit?: number;
                    };
                }
            }
        }
    }
}
