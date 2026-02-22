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
                purge: (props: Purge) => Promise<void>;
            }

            type Create = {
                transaction: EntityManager;
                input: {
                    group: RoleConflictGroupEntity;
                    roles: RoleEntity[];
                };
                context: RequestContext;
                realm: RealmEntity;
                actor: string;
            };

            type Purge = {
                entities: RoleConflictMemberEntity[];
                transaction: EntityManager;
                context: RequestContext;
                reason: string;
                realm: string;
                actor: string;
            };
        }
    }
}
