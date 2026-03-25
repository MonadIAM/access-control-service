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
                restore: (props: Restore) => void;
                revoke: (props: Revoke) => void;
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
            };

            type Update = {
                patch: Partial<Entities.RoleConflictGroup.MutableFields>;
                entity: RoleConflictGroupEntity;
            };

            type Purge = {
                transaction: EntityManager;
                entities: RoleConflictGroupEntity[];
            };

            type Revoke = {
                entities: RoleConflictGroupEntity[];
            };

            type Restore = {
                entities: RoleConflictGroupEntity[];
            };
        }
    }
}
