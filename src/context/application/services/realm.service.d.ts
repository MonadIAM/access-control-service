import { EntityManager } from "@mikro-orm/postgresql";

import { Realm as RealmEntity } from "~context/domain/entities";

declare global {
    namespace Services {
        namespace Realm {
            interface Contract {
                create: (props: Create) => void;
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
                input: {
                    patch: Partial<Entities.Realm.MutableFields>;
                    entity: RealmEntity;
                    reason: string;
                };
                actor: string;
            };

            type Purge = {
                transaction: EntityManager;
                input: {
                    entities: RealmEntity[];
                    reason: string;
                };
            };

            type Revoke = {
                input: {
                    entities: RealmEntity[];
                    reason: string;
                };
                actor: string;
            };

            type Restore = {
                input: {
                    entities: RealmEntity[];
                    reason: string;
                };
                actor: string;
            };
        }
    }
}
