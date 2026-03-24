import { EntityManager } from "@mikro-orm/postgresql";

import { Permission as PermissionEntity, Realm as RealmEntity } from "~context/domain/entities";

declare global {
    namespace Services {
        namespace Permission {
            interface Contract {
                create: (props: Create) => Promise<void>;
                restore: (props: Restore) => void;
                revoke: (props: Revoke) => void;
                update: (props: Update) => void;
                purge: (props: Purge) => void;
            }

            type Create = {
                transaction: EntityManager;
                input: {
                    code: string;
                    name: string;
                    description?: string;
                };
                realm: RealmEntity;
                actor: string;
            };

            type Update = {
                input: {
                    patch: Partial<Entities.Permission.MutableFields>;
                    entity: PermissionEntity;
                    reason: string;
                };
                actor: string;
            };

            type Purge = {
                transaction: EntityManager;
                input: {
                    entities: PermissionEntity[];
                    reason: string;
                };
            };

            type Revoke = {
                input: {
                    entities: PermissionEntity[];
                    reason: string;
                };
                actor: string;
            };

            type Restore = {
                input: {
                    entities: PermissionEntity[];
                    reason: string;
                };
                actor: string;
            };
        }
    }
}
