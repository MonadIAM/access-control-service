import { EntityManager } from "@mikro-orm/postgresql";

import { Realm as RealmEntity } from "~context/domain/entities";

declare global {
    namespace Services {
        namespace Realm {
            interface Contract {
                create: (props: Create) => RealmEntity;
                restore: (props: Restore) => void;
                revoke: (props: Revoke) => void;
                update: (props: Update) => void;
                purge: (props: Purge) => void;
            }

            type Create = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    code: string;
                    name: string;
                    description?: string;
                };
                actor: string;
            };

            type Update = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    patch: Partial<Entities.Realm.MutableFields>;
                    entity: RealmEntity;
                    reason: string;
                };
                actor: string;
            };

            type Purge = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    entities: RealmEntity[];
                    reason: string;
                };
                actor: string;
            };

            type Revoke = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    entities: RealmEntity[];
                    reason: string;
                };
                actor: string;
            };

            type Restore = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    entities: RealmEntity[];
                    reason: string;
                };
                actor: string;
            };
        }
    }
}
