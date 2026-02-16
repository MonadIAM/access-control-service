import { EntityManager } from "@mikro-orm/postgresql";

import { Permission as PermissionEntity, Realm as RealmEntity } from "~context/domain/entities";

declare global {
    namespace Services {
        namespace Permission {
            interface Contract {
                create: (props: Create) => Promise<PermissionEntity>;
                update: (props: Update) => Promise<void>;
                purge: (props: Purge) => Promise<void>;
                revoke: (props: Revoke) => Promise<void>;
                restore: (props: Restore) => Promise<void>;
            }

            type Create = {
                transaction: EntityManager;
                input: Entities.Permission.Seed;
                context: RequestContext;
                realm: RealmEntity;
            };

            type Update = {
                transaction: EntityManager;
                input: {
                    patch: Partial<Entities.Permission.MutableFields>;
                    reason: string;
                };
                context: RequestContext;
                entity: PermissionEntity;
                realm: string;
                actor: string;
            };

            type Purge = {
                transaction: EntityManager;
                context: RequestContext;
                entities: PermissionEntity[];
                reason: string;
                realm: string;
                actor: string;
            };

            type Revoke = {
                transaction: EntityManager;
                context: RequestContext;
                entities: PermissionEntity[];
                reason: string;
                realm: string;
                actor: string;
            };

            type Restore = {
                transaction: EntityManager;
                context: RequestContext;
                entities: PermissionEntity[];
                reason: string;
                realm: string;
                actor: string;
            };
        }
    }
}
