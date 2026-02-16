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
                purge: (props: Purge) => Promise<void>;
                revoke: (props: Revoke) => Promise<void>;
                restore: (props: Restore) => Promise<void>;
            }

            type Create = {
                transaction: EntityManager;
                input: {
                    permissions: PermissionEntity[];
                    role: RoleEntity;
                };
                context: RequestContext;
                realm: RealmEntity;
                actor: string;
            };

            type Purge = {
                entities: RolePermissionAssignmentEntity[];
                transaction: EntityManager;
                context: RequestContext;
                reason: string;
                realm: string;
                actor: string;
            };

            type Revoke = {
                entities: RolePermissionAssignmentEntity[];
                transaction: EntityManager;
                context: RequestContext;
                reason: string;
                realm: string;
                actor: string;
            };

            type Restore = {
                entities: RolePermissionAssignmentEntity[];
                transaction: EntityManager;
                context: RequestContext;
                reason: string;
                realm: string;
                actor: string;
            };
        }
    }
}
