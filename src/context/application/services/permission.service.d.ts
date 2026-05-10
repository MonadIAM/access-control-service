import { EntityManager } from "@mikro-orm/postgresql";

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
                    realm: Entities.Realm;
                };

                type Result = Entities.Permission;
            }

            type Update = {
                patch: Partial<Entities.Permission.MutableFields>;
                entity: Entities.Permission;
            };

            type Purge = {
                transaction: EntityManager;
                entities: Entities.Permission[];
            };

            type Revoke = {
                entities: Entities.Permission[];
            };

            type Restore = {
                entities: Entities.Permission[];
            };
        }
    }
}
