import { EntityManager } from "@mikro-orm/postgresql";

import { Realm as RealmEntity } from "~context/domain/entities";

declare global {
    namespace Services {
        namespace Realm {
            interface Contract {
                create: (props: Create) => Promise<RealmEntity>;
                update: (props: Update) => Promise<void>;
                purge: (props: Purge) => Promise<void>;
                revoke: (props: Revoke) => Promise<void>;
                restore: (props: Restore) => Promise<void>;
            }

            type Create = {
                transaction: EntityManager;
                context: RequestContext;
                input: Entities.Realm.ConstructorProps;
            };

            type Update = {
                transaction: EntityManager;
                input: {
                    patch: Partial<Entities.Realm.MutableFields>;
                    reason: string;
                };
                context: RequestContext;
                entity: RealmEntity;
                actor: string;
            };

            type Purge = {
                transaction: EntityManager;
                context: RequestContext;
                entities: RealmEntity[];
                reason: string;
                actor: string;
            };

            type Revoke = {
                transaction: EntityManager;
                context: RequestContext;
                entities: RealmEntity[];
                reason: string;
                actor: string;
            };

            type Restore = {
                transaction: EntityManager;
                context: RequestContext;
                entities: RealmEntity[];
                reason: string;
                actor: string;
            };
        }
    }
}
