import { EntityManager } from "@mikro-orm/postgresql";

import { PermissionOverrideEffect } from "~context/enums";

declare global {
    namespace Services {
        namespace PermissionOverride {
            interface Contract {
                create: (props: Create) => Promise<Entities.PermissionOverride>;
                restore: (props: Restore) => void;
                revoke: (props: Revoke) => void;
                purge: (props: Purge) => void;
            }

            type Create = {
                transaction: EntityManager;
                input: {
                    effect: PermissionOverrideEffect;
                    permission: Entities.Permission;
                    account: string;
                };
                realm: Entities.Realm;
            };

            type Purge = {
                transaction: EntityManager;
                entities: Entities.PermissionOverride[];
            };

            type Revoke = {
                entities: Entities.PermissionOverride[];
            };

            type Restore = {
                entities: Entities.PermissionOverride[];
            };
        }
    }
}
