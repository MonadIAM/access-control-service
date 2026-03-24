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
                restore: (props: Restore) => void;
                revoke: (props: Revoke) => void;
                update: (props: Update) => void;
                purge: (props: Purge) => void;
            }

            type Create = {
                transaction: EntityManager;
                input: {
                    delegator: RoleEntity;
                    description: string;
                    depthLimit?: number;
                    target: RoleEntity;
                };
                realm: RealmEntity;
                actor: string;
            };

            type Update = {
                input: {
                    patch: Partial<Entities.RoleConflictGroup.MutableFields>;
                    entity: RoleDelegationPolicyEntity;
                    reason: string;
                };
                actor: string;
            };

            type Purge = {
                transaction: EntityManager;
                input: {
                    entities: RoleDelegationPolicyEntity[];
                    reason: string;
                };
            };

            type Revoke = {
                input: {
                    entities: RoleDelegationPolicyEntity[];
                    reason: string;
                };
                actor: string;
            };

            type Restore = {
                input: {
                    entities: RoleDelegationPolicyEntity[];
                    reason: string;
                };
                actor: string;
            };
        }
    }
}
