import { EntityManager } from "@mikro-orm/postgresql";

import { RoleDelegationPolicy as RoleDelegationPolicyEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace RoleDelegationPolicy {
            type Entity = RoleDelegationPolicyEntity;

            interface InternalContract extends Repositories.Base.Contract<Entity, Adapters.RoleDelegationPolicy.Types> {
                wouldExceedPolicyLimit: (props: WouldExceedPolicyLimit) => Promise<boolean>;
                existsTransitivePath: (props: ExistsTransitivePath) => Promise<boolean>;
                isDelegationAllowed: (props: IsDelegationAllowed) => Promise<boolean>;
            }

            interface ExternalContract extends Pick<InternalContract, "findUniqueOrThrow" | "findMany"> {}

            type ExistsTransitivePath = {
                transaction?: EntityManager;
                from: string;
                to: string | string[];
            };

            type IsDelegationAllowed = {
                transaction?: EntityManager;
                roles: string[];
                realm: string;
                actor: string;
            };

            type WouldExceedPolicyLimit = {
                transaction?: EntityManager;
                delegator: string;
                count?: number;
            };
        }
    }
}
