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
            };

            type Update = {
                patch: Partial<Entities.RoleConflictGroup.MutableFields>;
                entity: RoleDelegationPolicyEntity;
            };

            type Purge = {
                transaction: EntityManager;
                entities: RoleDelegationPolicyEntity[];
            };

            type Revoke = {
                entities: RoleDelegationPolicyEntity[];
            };

            type Restore = {
                entities: RoleDelegationPolicyEntity[];
            };
        }
    }
}
