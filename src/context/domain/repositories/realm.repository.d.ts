import { EntityManager } from "@mikro-orm/postgresql";

import { Realm as RealmEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace Realm {
            type Entity = RealmEntity;

            interface InternalContract extends Repositories.Base.Contract<Entity, Adapters.Realm.Types> {
                wouldExceedRealmLimit: (props: WouldExceedRealmLimit) => Promise<boolean>;
                getLookupList: (props: GetLookupList) => Promise<[Entity[], number]>;
            }

            interface ExternalContract extends Pick<InternalContract, "getLookupList" | "findUniqueOrThrow" | "findMany"> {}

            type GetLookupList = {
                pagination: Pagination;
                realms?: string[];
                term: string;
            };

            type WouldExceedRealmLimit = {
                transaction?: EntityManager;
                account: string;
                count?: number;
            };
        }
    }
}
