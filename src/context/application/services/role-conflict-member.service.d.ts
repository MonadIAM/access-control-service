import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Services {
        namespace RoleConflictMember {
            interface Contract {
                create: (props: Create) => Promise<void>;
                purge: (props: Purge) => void;
            }

            type Create = {
                transaction: EntityManager;
                input: {
                    group: Entities.RoleConflictGroup;
                    roles: Entities.Role[];
                };
            };

            type Purge = {
                transaction: EntityManager;
                entities: Entities.RoleConflictMember[];
            };
        }
    }
}
