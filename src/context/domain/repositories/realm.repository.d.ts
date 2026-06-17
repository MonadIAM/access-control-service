import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Repositories {
        namespace Realm {
            interface Contract extends Repositories.Base.Contract<Entities.Realm, Adapters.Realm.Types> {
                wouldExceedRealmLimit(props: WouldExceedRealmLimit.Props): WouldExceedRealmLimit.Result;
                getLookupList(props: GetLookupList.Props): GetLookupList.Result;
            }

            interface QueryContract extends Pick<Contract, "getLookupList" | "findUniqueOrThrow" | "findMany"> {}

            namespace GetLookupList {
                type Props = {
                    pagination: Pagination;
                    realms?: string[];
                    term: string;
                };

                type Result = Promise<[Entities.Realm[], number]>;
            }

            namespace WouldExceedRealmLimit {
                type Props = {
                    transaction?: EntityManager;
                    account: string;
                    count?: number;
                };

                type Result = Promise<boolean>;
            }
        }
    }
}
