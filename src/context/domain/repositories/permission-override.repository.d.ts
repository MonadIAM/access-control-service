import { EntityManager } from "@mikro-orm/postgresql";

import { PermissionOverride as PermissionOverrideEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace PermissionOverride {
            type Entity = PermissionOverrideEntity;

            interface InternalContract extends Repositories.Base.Contract<Entity, Adapters.PermissionOverride.Types> {
                wouldExceedOverrideLimit: (props: WouldExceedOverrideLimit) => Promise<boolean>;
            }

            interface ExternalContract extends Pick<InternalContract, "findUniqueOrThrow" | "findMany"> {}

            type WouldExceedOverrideLimit = {
                transaction?: EntityManager;
                account: string;
                count?: number;
                realm: string;
            };
        }
    }
}
