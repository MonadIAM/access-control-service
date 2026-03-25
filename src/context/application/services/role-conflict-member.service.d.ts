import { EntityManager } from "@mikro-orm/postgresql";

import {
    RoleConflictMember as RoleConflictMemberEntity,
    RoleConflictGroup as RoleConflictGroupEntity,
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
                input: {
                    group: RoleConflictGroupEntity;
                    roles: RoleEntity[];
                };
            };

            type Purge = {
                transaction: EntityManager;
                entities: RoleConflictMemberEntity[];
            };
        }
    }
}
