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
                restore: (props: Restore) => void;
                revoke: (props: Revoke) => void;
                create: (props: Create) => void;
                update: (props: Update) => void;
                purge: (props: Purge) => void;
            }

            type Create = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    members: RoleEntity[];
                    description: string;
                    maxAllowed: number;
                    code: string;
                    name: string;
                };
                realm: RealmEntity;
                actor: string;
            };

            type Update = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    patch: Partial<Entities.RoleConflictGroup.MutableFields>;
                    entity: RoleConflictGroupEntity;
                    reason: string;
                };
                realm: string;
                actor: string;
            };

            type Purge = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    entities: RoleConflictGroupEntity[];
                    reason: string;
                };
                realm: string;
                actor: string;
            };

            type Revoke = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    entities: RoleConflictGroupEntity[];
                    reason: string;
                };
                realm: string;
                actor: string;
            };

            type Restore = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    entities: RoleConflictGroupEntity[];
                    reason: string;
                };
                realm: string;
                actor: string;
            };
        }
    }
}
