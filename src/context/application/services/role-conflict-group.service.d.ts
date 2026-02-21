import { EntityManager } from "@mikro-orm/postgresql";

import {
    RoleConflictGroup as RoleConflictGroupEntity,
    Realm as RealmEntity,
    Role as RoleEntity,
} from "~context/domain/entities";

declare global {
    namespace Services {
        namespace RoleConflictGroup {
            interface Contract {
                create: (props: Create) => Promise<void>;
                update: (props: Update) => Promise<void>;
                purge: (props: Purge) => Promise<void>;
                revoke: (props: Revoke) => Promise<void>;
                restore: (props: Restore) => Promise<void>;
            }

            type Create = {
                transaction: EntityManager;
                input: {
                    members: RoleEntity[];
                    description: string;
                    maxAllowed: number;
                    code: string;
                    name: string;
                };
                context: RequestContext;
                realm: RealmEntity;
                actor: string;
            };

            type Update = {
                transaction: EntityManager;
                input: {
                    patch: Partial<Entities.RoleConflictGroup.MutableFields>;
                    reason: string;
                };
                context: RequestContext;
                entity: RoleConflictGroupEntity;
                realm: string;
                actor: string;
            };

            type Purge = {
                entities: RoleConflictGroupEntity[];
                transaction: EntityManager;
                context: RequestContext;
                reason: string;
                realm: string;
                actor: string;
            };

            type Revoke = {
                entities: RoleConflictGroupEntity[];
                transaction: EntityManager;
                context: RequestContext;
                reason: string;
                realm: string;
                actor: string;
            };

            type Restore = {
                entities: RoleConflictGroupEntity[];
                transaction: EntityManager;
                context: RequestContext;
                reason: string;
                realm: string;
                actor: string;
            };
        }
    }
}
