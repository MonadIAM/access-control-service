import { EntityManager } from "@mikro-orm/postgresql";

import { Permission as PermissionEntity, Realm as RealmEntity } from "~context/domain/entities";

declare global {
    namespace Services {
        namespace Permission {
            interface Contract {
                create: (props: Create) => Promise<PermissionEntity>;
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
            };

            type Update = {
                patch: Partial<Entities.Permission.MutableFields>;
                entity: PermissionEntity;
            };

            type Purge = {
                transaction: EntityManager;
                entities: PermissionEntity[];
            };

            type Revoke = {
                entities: PermissionEntity[];
            };

            type Restore = {
                entities: PermissionEntity[];
            };
        }
    }
}
