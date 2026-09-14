import { ConfigService } from "@nestjs/config";

import { RoleConflictMemberRepository } from "~context/infrastructure/repositories/role-conflict-member.repository";
import { RoleConflictGroupRepository } from "~context/infrastructure/repositories/role-conflict-group.repository";
import { RoleConflictMemberService } from "~context/domain/services/role-conflict-member.service";
import { RoleRepository } from "~context/infrastructure/repositories/role.repository";

export class RoleConflictMemberIntegrationHelpers implements Integration.Domain.RoleConflictMember.Contract {
    public service(
        context: Integration.Postgres.Suite.FactoryContext,
        props: Integration.Domain.RoleConflictMember.Config.Props = {},
    ): Integration.Domain.RoleConflictMember.Service.Context {
        const repositories = this.repositories(context, props);

        return {
            roleConflictMemberService: new RoleConflictMemberService(
                repositories.roleConflictMembers,
                repositories.roleConflictGroups,
                repositories.roles,
            ),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
        props: Integration.Domain.RoleConflictMember.Config.Props = {},
    ): Integration.Domain.RoleConflictMember.Repositories.Context {
        const config = this.config(props);

        return {
            roleConflictMembers: new RoleConflictMemberRepository(context.readManager, config),
            roleConflictGroups: new RoleConflictGroupRepository(context.readManager, config),
            roles: new RoleRepository(context.readManager, config),
        };
    }

    private config(props: Integration.Domain.RoleConflictMember.Config.Props): ConfigService {
        return new ConfigService({
            MAX_CONFLICT_MEMBERS_COUNT: props.membersLimit ?? 3,
            CONFLICT_GROUP_PER_REALM_LIMIT: 3,
            ROLE_PER_REALM_LIMIT: 3,
            REALM_LIMIT: 3,
        });
    }
}
