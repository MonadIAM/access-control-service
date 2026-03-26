import { EntityManager } from "@mikro-orm/postgresql";

import { Realm as RealmEntity, Role as RoleEntity } from "~context/domain/entities";

declare global {
    namespace Services {
        namespace Realm {
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
                    code: string;
                    name: string;
                    description?: string;
                };
                actor: string;
            };

            type Update = {
                patch: Partial<Entities.Realm.MutableFields>;
                entity: RealmEntity;
            };

            type Purge = {
                transaction: EntityManager;
                entities: RealmEntity[];
            };

            type Revoke = {
                entities: RealmEntity[];
            };

            type Restore = {
                entities: RealmEntity[];
            };

            namespace CreateBaseRoles {
                type Props = {
                    transaction: EntityManager;
                    input: Create["input"];
                    realm: RealmEntity;
                };
                type Result = {
                    admin: RoleEntity;
                    user: RoleEntity;
                    root: RoleEntity;
                };
            }

            type AssignBasePermissions = {
                transaction: EntityManager;
                roles: CreateBaseRoles.Result;
                realm: RealmEntity;
            };
        }
    }
}
