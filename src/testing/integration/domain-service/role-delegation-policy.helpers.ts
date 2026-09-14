import { ConfigService } from "@nestjs/config";

import { RoleDelegationPolicyRepository } from "~context/infrastructure/repositories/role-delegation-policy.repository";
import { RoleDelegationPolicyService } from "~context/domain/services/role-delegation-policy.service";
import { RealmRepository } from "~context/infrastructure/repositories/realm.repository";
import { RoleRepository } from "~context/infrastructure/repositories/role.repository";

export class RoleDelegationPolicyIntegrationHelpers implements Integration.Domain.RoleDelegationPolicy.Contract {
    public service(
        context: Integration.Postgres.Suite.FactoryContext,
        props: Integration.Domain.RoleDelegationPolicy.Config.Props = {},
    ): Integration.Domain.RoleDelegationPolicy.Service.Context {
        const repositories = this.repositories(context, props);

        return {
            roleDelegationPolicyService: new RoleDelegationPolicyService(
                repositories.roleDelegationPolicies,
                repositories.realms,
                repositories.roles,
            ),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
        props: Integration.Domain.RoleDelegationPolicy.Config.Props = {},
    ): Integration.Domain.RoleDelegationPolicy.Repositories.Context {
        const config = this.config(props);

        return {
            roleDelegationPolicies: new RoleDelegationPolicyRepository(context.readManager, config),
            realms: new RealmRepository(context.readManager, config),
            roles: new RoleRepository(context.readManager, config),
        };
    }

    private config(props: Integration.Domain.RoleDelegationPolicy.Config.Props): ConfigService {
        return new ConfigService({
            DELEGATION_POLICY_PER_ROLE_LIMIT: props.policyLimit ?? 3,
            ROLE_PER_REALM_LIMIT: 3,
            REALM_LIMIT: 3,
        });
    }
}
