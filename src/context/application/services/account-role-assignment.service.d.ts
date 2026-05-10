import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Services {
        namespace AccountRoleAssignment {
            interface Contract {
                create: (props: Create) => Promise<Entities.AccountRoleAssignment[]>;
                assign: (props: Assign) => Entities.AccountRoleAssignment;
                restore: (props: Restore) => void;
                revoke: (props: Revoke) => void;
                purge: (props: Purge) => void;
            }

            type Create = {
                transaction: EntityManager;
                input: {
                    roles: Entities.Role[];
                    account: string;
                };
                realm: Entities.Realm;
                actor: string;
            };

            type Purge = {
                transaction: EntityManager;
                entities: Entities.AccountRoleAssignment[];
            };

            type Revoke = {
                entities: Entities.AccountRoleAssignment[];
            };

            type Restore = {
                entities: Entities.AccountRoleAssignment[];
            };

            type Assign = {
                transaction: EntityManager;
                input: {
                    realm: Entities.Realm;
                    role: Entities.Role;
                    account: string;
                };
            };
        }
    }
}
