import { EntityManager } from "@mikro-orm/postgresql";

import { Permission as PermissionEntity, Realm as RealmEntity } from "~context/domain/entities";

declare global {
    namespace Services {
        namespace Permission {
            interface Contract {
                create: (props: Create.Props) => Promise<Create.Result>;
                restore: (props: Restore) => void;
                revoke: (props: Revoke) => void;
                update: (props: Update) => void;
                purge: (props: Purge) => void;
            }

            namespace Create {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        code: string;
                        name: string;
                        description?: string;
                    };
                    realm: RealmEntity;
                };

                type Result = PermissionEntity;
            }

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
