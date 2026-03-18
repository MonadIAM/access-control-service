import { EntityManager } from "@mikro-orm/postgresql";

import { Permission as PermissionEntity, Realm as RealmEntity } from "~context/domain/entities";

declare global {
    namespace Services {
        namespace Permission {
            interface Contract {
                create: (props: Create) => PermissionEntity;
                restore: (props: Restore) => void;
                revoke: (props: Revoke) => void;
                update: (props: Update) => void;
                purge: (props: Purge) => void;
            }

            type Create = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    code: string;
                    name: string;
                    description?: string;
                };
                realm: RealmEntity;
                actor: string;
            };

            type Update = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    patch: Partial<Entities.Permission.MutableFields>;
                    entity: PermissionEntity;
                    reason: string;
                };
                realm: string;
                actor: string;
            };

            type Purge = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    entities: PermissionEntity[];
                    reason: string;
                };
                realm: string;
                actor: string;
            };

            type Revoke = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    entities: PermissionEntity[];
                    reason: string;
                };
                realm: string;
                actor: string;
            };

            type Restore = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    entities: PermissionEntity[];
                    reason: string;
                };
                realm: string;
                actor: string;
            };
        }
    }
}
