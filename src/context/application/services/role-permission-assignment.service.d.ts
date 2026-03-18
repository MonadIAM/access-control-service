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
                context: RequestContext;
                input: {
                    permissions: PermissionEntity[];
                    role: RoleEntity;
                };
                realm: RealmEntity;
                actor: string;
            };

            type Purge = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    entities: RolePermissionAssignmentEntity[];
                    reason: string;
                };
                realm: string;
                actor: string;
            };

            type Revoke = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    entities: RolePermissionAssignmentEntity[];
                    reason: string;
                };
                realm: string;
                actor: string;
            };

            type Restore = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    entities: RolePermissionAssignmentEntity[];
                    reason: string;
                };
                realm: string;
                actor: string;
            };
        }
    }
}
