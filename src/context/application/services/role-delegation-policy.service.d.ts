import { EntityManager } from "@mikro-orm/postgresql";

import {
    RoleDelegationPolicy as RoleDelegationPolicyEntity,
    Realm as RealmEntity,
    Role as RoleEntity,
} from "~context/domain/entities";

declare global {
    namespace Services {
        namespace RoleDelegationPolicy {
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
                    delegator: RoleEntity;
                    target: RoleEntity;
                    description: string;
                    depthLimit?: number;
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
                entity: RoleDelegationPolicyEntity;
                realm: string;
                actor: string;
            };

            type Purge = {
                entities: RoleDelegationPolicyEntity[];
                transaction: EntityManager;
                context: RequestContext;
                reason: string;
                realm: string;
                actor: string;
            };

            type Revoke = {
                entities: RoleDelegationPolicyEntity[];
                transaction: EntityManager;
                context: RequestContext;
                reason: string;
                realm: string;
                actor: string;
            };

            type Restore = {
                entities: RoleDelegationPolicyEntity[];
                transaction: EntityManager;
                context: RequestContext;
                reason: string;
                realm: string;
                actor: string;
            };
        }
    }
}
