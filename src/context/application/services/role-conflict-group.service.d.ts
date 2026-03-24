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
                input: {
                    patch: Partial<Entities.RoleConflictGroup.MutableFields>;
                    entity: RoleConflictGroupEntity;
                    reason: string;
                };
                actor: string;
            };

            type Purge = {
                transaction: EntityManager;
                input: {
                    entities: RoleConflictGroupEntity[];
                    reason: string;
                };
            };

            type Revoke = {
                input: {
                    entities: RoleConflictGroupEntity[];
                    reason: string;
                };
                actor: string;
            };

            type Restore = {
                input: {
                    entities: RoleConflictGroupEntity[];
                    reason: string;
                };
                actor: string;
            };
        }
    }
}
