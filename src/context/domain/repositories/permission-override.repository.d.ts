import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Repositories {
        namespace PermissionOverride {
            interface Contract
                extends Repositories.Base.Contract<Entities.PermissionOverride, Adapters.PermissionOverride.Types> {
                wouldExceedOverrideLimit(props: WouldExceedOverrideLimit.Props): WouldExceedOverrideLimit.Result;
            }

            interface QueryContract extends Pick<Contract, "findUniqueOrThrow" | "findMany"> {}

            namespace WouldExceedOverrideLimit {
                type Props = {
                    transaction?: EntityManager;
                    account: string;
                    count?: number;
                    realm: string;
                };

                type Result = Promise<boolean>;
            }
        }
    }
}
