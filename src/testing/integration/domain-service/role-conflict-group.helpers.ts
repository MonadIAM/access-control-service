import { ConfigService } from "@nestjs/config";

import { RoleConflictGroupRepository } from "~context/infrastructure/repositories/role-conflict-group.repository";
import { RoleConflictGroupService } from "~context/domain/services/role-conflict-group.service";
import { RealmRepository } from "~context/infrastructure/repositories/realm.repository";
import { RoleRepository } from "~context/infrastructure/repositories/role.repository";

export class RoleConflictGroupIntegrationHelpers implements Integration.Domain.RoleConflictGroup.Contract {
    public service(
        context: Integration.Postgres.Suite.FactoryContext,
        props: Integration.Domain.RoleConflictGroup.Config.Props = {},
    ): Integration.Domain.RoleConflictGroup.Service.Context {
        const repositories = this.repositories(context, props);
        const config = this.config(props);

        return {
            roleConflictGroupService: new RoleConflictGroupService(
                repositories.roleConflictGroups,
                repositories.realms,
                repositories.roles,
                config,
            ),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
        props: Integration.Domain.RoleConflictGroup.Config.Props = {},
    ): Integration.Domain.RoleConflictGroup.Repositories.Context {
        const config = this.config(props);

        return {
            roleConflictGroups: new RoleConflictGroupRepository(context.readManager, config),
            realms: new RealmRepository(context.readManager, config),
            roles: new RoleRepository(context.readManager, config),
        };
    }

    private config(props: Integration.Domain.RoleConflictGroup.Config.Props): ConfigService {
        return new ConfigService({
            MAX_CONFLICT_MEMBERS_COUNT: props.membersLimit ?? 3,
            CONFLICT_GROUP_PER_REALM_LIMIT: props.groupLimit ?? 3,
            ROLE_PER_REALM_LIMIT: 3,
            REALM_LIMIT: 3,
        });
    }
}
