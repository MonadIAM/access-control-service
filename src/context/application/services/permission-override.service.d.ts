import { EntityManager } from "@mikro-orm/postgresql";

import { PermissionOverrideEffect } from "~context/enums";
import {
    PermissionOverride as PermissionOverrideEntity,
    Permission as PermissionEntity,
    Realm as RealmEntity,
} from "~context/domain/entities";

declare global {
    namespace Services {
        namespace PermissionOverride {
            interface Contract {
                create: (props: Create) => Promise<void>;
                restore: (props: Restore) => void;
                revoke: (props: Revoke) => void;
                purge: (props: Purge) => void;
            }

            type Create = {
                transaction: EntityManager;
                input: {
                    effect: PermissionOverrideEffect;
                    permission: PermissionEntity;
                    account: string;
                };
                realm: RealmEntity;
            };

            type Purge = {
                transaction: EntityManager;
                entities: PermissionOverrideEntity[];
            };

            type Revoke = {
                entities: PermissionOverrideEntity[];
            };

            type Restore = {
                entities: PermissionOverrideEntity[];
            };
        }
    }
}
