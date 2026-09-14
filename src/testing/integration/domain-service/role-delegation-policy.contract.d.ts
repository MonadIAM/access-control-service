import type { RoleDelegationPolicyRepository } from "~context/infrastructure/repositories/role-delegation-policy.repository";
import type { RoleDelegationPolicyService } from "~context/domain/services/role-delegation-policy.service";
import type { RealmRepository } from "~context/infrastructure/repositories/realm.repository";
import type { RoleRepository } from "~context/infrastructure/repositories/role.repository";

declare global {
    namespace Integration {
        namespace Domain {
            namespace RoleDelegationPolicy {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly roleDelegationPolicyService: RoleDelegationPolicyService;
                        readonly repositories: Repositories.Context;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
                }

                namespace Repositories {
                    type Context = {
                        readonly roleDelegationPolicies: RoleDelegationPolicyRepository;
                        readonly realms: RealmRepository;
                        readonly roles: RoleRepository;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
                }

                namespace Config {
                    type Props = {
                        readonly policyLimit?: number;
                    };
                }
            }
        }
    }
}
