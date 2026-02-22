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
                purge: (props: Purge) => Promise<void>;
                revoke: (props: Revoke) => Promise<void>;
                restore: (props: Restore) => Promise<void>;
            }

            type Create = {
                transaction: EntityManager;
                input: {
                    effect: PermissionOverrideEffect;
                    permission: PermissionEntity;
                    account: string;
                };
                context: RequestContext;
                realm: RealmEntity;
                actor: string;
            };

            type Purge = {
                transaction: EntityManager;
                context: RequestContext;
                entities: PermissionOverrideEntity[];
                reason: string;
                realm: string;
                actor: string;
            };

            type Revoke = {
                transaction: EntityManager;
                context: RequestContext;
                entities: PermissionOverrideEntity[];
                reason: string;
                realm: string;
                actor: string;
            };

            type Restore = {
                transaction: EntityManager;
                context: RequestContext;
                entities: PermissionOverrideEntity[];
                reason: string;
                realm: string;
                actor: string;
            };
        }
    }
}
