import { EntityManager } from "@mikro-orm/postgresql";

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
                    delegator: Entities.Role;
                    target: Entities.Role;
                    description: string;
                    depthLimit?: number;
                };
                realm: Entities.Realm;
            };

            type Update = {
                patch: Partial<Entities.RoleConflictGroup.MutableFields>;
                entity: Entities.RoleDelegationPolicy;
            };

            type Purge = {
                transaction: EntityManager;
                entities: Entities.RoleDelegationPolicy[];
            };

            type Revoke = {
                entities: Entities.RoleDelegationPolicy[];
            };

            type Restore = {
                entities: Entities.RoleDelegationPolicy[];
            };
        }
    }
}
