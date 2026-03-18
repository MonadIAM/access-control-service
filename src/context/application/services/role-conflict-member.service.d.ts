import { EntityManager } from "@mikro-orm/postgresql";

import {
    RoleConflictMember as RoleConflictMemberEntity,
    RoleConflictGroup as RoleConflictGroupEntity,
    Realm as RealmEntity,
    Role as RoleEntity,
} from "~context/domain/entities";

declare global {
    namespace Services {
        namespace RoleConflictMember {
            interface Contract {
                create: (props: Create) => Promise<void>;
                purge: (props: Purge) => void;
            }

            type Create = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    group: RoleConflictGroupEntity;
                    roles: RoleEntity[];
                };
                realm: RealmEntity;
                actor: string;
            };

            type Purge = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    entities: RoleConflictMemberEntity[];
                    reason: string;
                };
                realm: string;
                actor: string;
            };
        }
    }
}
