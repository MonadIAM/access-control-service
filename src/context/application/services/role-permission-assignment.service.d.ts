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
                actor: string;
            };

            type Purge = {
                transaction: EntityManager;
                input: {
                    entities: RolePermissionAssignmentEntity[];
                    reason: string;
                };
            };

            type Revoke = {
                input: {
                    entities: RolePermissionAssignmentEntity[];
                    reason: string;
                };
                actor: string;
            };

            type Restore = {
                input: {
                    entities: RolePermissionAssignmentEntity[];
                    reason: string;
                };
                actor: string;
            };
        }
    }
}
