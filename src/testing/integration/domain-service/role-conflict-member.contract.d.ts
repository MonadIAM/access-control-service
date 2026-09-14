import type { RoleConflictMemberRepository } from "~context/infrastructure/repositories/role-conflict-member.repository";
import type { RoleConflictGroupRepository } from "~context/infrastructure/repositories/role-conflict-group.repository";
import type { RoleConflictMemberService } from "~context/domain/services/role-conflict-member.service";
import type { RoleRepository } from "~context/infrastructure/repositories/role.repository";

declare global {
    namespace Integration {
        namespace Domain {
            namespace RoleConflictMember {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly roleConflictMemberService: RoleConflictMemberService;
                        readonly repositories: Repositories.Context;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
                }

                namespace Repositories {
                    type Context = {
                        readonly roleConflictMembers: RoleConflictMemberRepository;
                        readonly roleConflictGroups: RoleConflictGroupRepository;
                        readonly roles: RoleRepository;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
                }

                namespace Config {
                    type Props = {
                        readonly membersLimit?: number;
                    };
                }
            }
        }
    }
}
