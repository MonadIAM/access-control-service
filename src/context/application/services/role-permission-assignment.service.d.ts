import { EntityManager } from "@mikro-orm/postgresql";

import {
    RolePermissionAssignment as RolePermissionAssignmentEntity,
    Permission as PermissionEntity,
    Realm as RealmEntity,
    Role as RoleEntity,
} from "~context/domain/entities";

declare global {
    namespace Services {
        namespace RolePermissionAssignment {
            interface Contract {
                create: (props: Create) => Promise<void>;
                restore: (props: Restore) => void;
                revoke: (props: Revoke) => void;
                purge: (props: Purge) => void;
            }

            type Create = {
                transaction: EntityManager;
                input: {
                    permissions: PermissionEntity[];
                    role: RoleEntity;
                };
                realm: RealmEntity;
            };

            type Purge = {
                transaction: EntityManager;
                entities: RolePermissionAssignmentEntity[];
            };

            type Revoke = {
                entities: RolePermissionAssignmentEntity[];
            };

            type Restore = {
                entities: RolePermissionAssignmentEntity[];
            };
        }
    }
}
