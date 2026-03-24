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
                restore: (props: Restore) => void;
                revoke: (props: Revoke) => void;
                create: (props: Create) => void;
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
                actor: string;
            };

            type Purge = {
                transaction: EntityManager;
                input: {
                    entities: PermissionOverrideEntity[];
                    reason: string;
                };
            };

            type Revoke = {
                input: {
                    entities: PermissionOverrideEntity[];
                    reason: string;
                };
                actor: string;
            };

            type Restore = {
                input: {
                    entities: PermissionOverrideEntity[];
                    reason: string;
                };
                actor: string;
            };
        }
    }
}
