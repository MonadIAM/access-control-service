import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Services {
        namespace RoleConflictGroup {
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
                    members: Entities.Role[];
                    description: string;
                    maxAllowed: number;
                    code: string;
                    name: string;
                };
                realm: Entities.Realm;
            };

            type Update = {
                patch: Partial<Entities.RoleConflictGroup.MutableFields>;
                entity: Entities.RoleConflictGroup;
            };

            type Purge = {
                transaction: EntityManager;
                entities: Entities.RoleConflictGroup[];
            };

            type Revoke = {
                entities: Entities.RoleConflictGroup[];
            };

            type Restore = {
                entities: Entities.RoleConflictGroup[];
            };
        }
    }
}
