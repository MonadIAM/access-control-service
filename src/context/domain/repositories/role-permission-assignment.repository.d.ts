import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Repositories {
        namespace RolePermissionAssignment {
            interface Contract
                extends Repositories.Base.Contract<
                    Entities.RolePermissionAssignment,
                    Adapters.RolePermissionAssignment.Types
                > {
                wouldExceedPermissionLimit(props: WouldExceedPermissionLimit.Props): WouldExceedPermissionLimit.Result;
            }

            interface QueryContract extends Pick<Contract, "findUniqueOrThrow" | "findMany"> {}

            namespace WouldExceedPermissionLimit {
                type Props = {
                    transaction?: EntityManager;
                    permissions: string[];
                    role: string;
                };

                type Result = Promise<boolean>;
            }
        }
    }
}
