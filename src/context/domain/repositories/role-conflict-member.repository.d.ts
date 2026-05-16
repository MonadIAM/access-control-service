import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Repositories {
        namespace RoleConflictMember {
            interface Contract
                extends Repositories.Base.Contract<Entities.RoleConflictMember, Adapters.RoleConflictMember.Types> {
                wouldExceedMemberLimit: (props: WouldExceedMemberLimit.Props) => WouldExceedMemberLimit.Result;
            }

            interface QueryContract extends Pick<Contract, "findUniqueOrThrow" | "findMany"> {}

            namespace WouldExceedMemberLimit {
                type Props = {
                    transaction?: EntityManager;
                    group: string;
                    count: number;
                };

                type Result = Promise<boolean>;
            }
        }
    }
}
