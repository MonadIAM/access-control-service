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
                restore: (props: Restore) => void;
                revoke: (props: Revoke) => void;
                purge: (props: Purge) => void;
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
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    entities: AccountRoleAssignmentEntity[];
                    reason: string;
                };
                realm: string;
                actor: string;
            };

            type Revoke = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    entities: AccountRoleAssignmentEntity[];
                    reason: string;
                };
                realm: string;
                actor: string;
            };

            type Restore = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    entities: AccountRoleAssignmentEntity[];
                    reason: string;
                };
                realm: string;
                actor: string;
            };
        }
    }
}
