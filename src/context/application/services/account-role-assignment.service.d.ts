import { EntityManager } from "@mikro-orm/postgresql";

import {
    AccountRoleAssignment as AccountRoleAssignmentEntity,
    Realm as RealmEntity,
    Role as RoleEntity,
} from "~context/domain/entities";

declare global {
    namespace Services {
        namespace AccountRoleAssignment {
            interface Contract {
                create: (props: Create) => Promise<void>;
                purge: (props: Purge) => Promise<void>;
                revoke: (props: Revoke) => Promise<void>;
                restore: (props: Restore) => Promise<void>;
            }

            type Create = {
                transaction: EntityManager;
                input: {
                    roles: RoleEntity[];
                    account: string;
                };
                context: RequestContext;
                realm: RealmEntity;
                actor: string;
            };

            type Purge = {
                entities: AccountRoleAssignmentEntity[];
                transaction: EntityManager;
                context: RequestContext;
                reason: string;
                realm: string;
                actor: string;
            };

            type Revoke = {
                entities: AccountRoleAssignmentEntity[];
                transaction: EntityManager;
                context: RequestContext;
                reason: string;
                realm: string;
                actor: string;
            };

            type Restore = {
                entities: AccountRoleAssignmentEntity[];
                transaction: EntityManager;
                context: RequestContext;
                reason: string;
                realm: string;
                actor: string;
            };
        }
    }
}
