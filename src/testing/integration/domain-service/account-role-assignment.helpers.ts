import { ConfigService } from "@nestjs/config";

import { AccountRoleAssignmentRepository } from "~context/infrastructure/repositories/account-role-assignment.repository";
import { RoleDelegationPolicyRepository } from "~context/infrastructure/repositories/role-delegation-policy.repository";
import { RoleConflictGroupRepository } from "~context/infrastructure/repositories/role-conflict-group.repository";
import { AccountRoleAssignmentService } from "~context/domain/services/account-role-assignment.service";
import { RealmRepository } from "~context/infrastructure/repositories/realm.repository";
import { RoleRepository } from "~context/infrastructure/repositories/role.repository";

export class AccountRoleAssignmentIntegrationHelpers implements Integration.Domain.AccountRoleAssignment.Contract {
    public service(
        context: Integration.Postgres.Suite.FactoryContext,
        props: Integration.Domain.AccountRoleAssignment.Config.Props = {},
    ): Integration.Domain.AccountRoleAssignment.Service.Context {
        const repositories = this.repositories(context, props);

        return {
            accountRoleAssignmentService: new AccountRoleAssignmentService(
                repositories.accountRoleAssignments,
                repositories.roleDelegationPolicies,
                repositories.roleConflictGroups,
                repositories.realms,
                repositories.roles,
            ),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
        props: Integration.Domain.AccountRoleAssignment.Config.Props = {},
    ): Integration.Domain.AccountRoleAssignment.Repositories.Context {
        const config = this.config(props);

        return {
            accountRoleAssignments: new AccountRoleAssignmentRepository(context.readManager, config),
            roleDelegationPolicies: new RoleDelegationPolicyRepository(context.readManager, config),
            roleConflictGroups: new RoleConflictGroupRepository(context.readManager, config),
            realms: new RealmRepository(context.readManager, config),
            roles: new RoleRepository(context.readManager, config),
        };
    }

    private config(props: Integration.Domain.AccountRoleAssignment.Config.Props): ConfigService {
        return new ConfigService({
            ROLE_PER_ACCOUNT_LIMIT: props.accountRoleLimit ?? 3,
            DELEGATION_POLICY_PER_ROLE_LIMIT: 3,
            CONFLICT_GROUP_PER_REALM_LIMIT: 3,
            MAX_CONFLICT_MEMBERS_COUNT: 3,
            ROLE_PER_REALM_LIMIT: 3,
            REALM_LIMIT: 3,
        });
    }
}
