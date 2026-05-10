import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Services {
        namespace RolePermissionAssignment {
            interface Contract {
                create: (props: Create) => Promise<Entities.RolePermissionAssignment[]>;
                restore: (props: Restore) => void;
                revoke: (props: Revoke) => void;
                purge: (props: Purge) => void;
            }

            type Create = {
                transaction: EntityManager;
                input: {
                    permissions: Entities.Permission[];
                    role: Entities.Role;
                };
                realm: Entities.Realm;
            };

            type Purge = {
                transaction: EntityManager;
                entities: Entities.RolePermissionAssignment[];
            };

            type Revoke = {
                entities: Entities.RolePermissionAssignment[];
            };

            type Restore = {
                entities: Entities.RolePermissionAssignment[];
            };
        }
    }
}
