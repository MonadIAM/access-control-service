import { EntityManager } from "@mikro-orm/postgresql";

import { AccountRoleAssignment as AccountRoleAssignmentEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace AccountRoleAssignment {
            type Entity = AccountRoleAssignmentEntity;

            interface InternalContract extends Repositories.Base.Contract<Entity, Adapters.AccountRoleAssignment.Types> {
                wouldExceedRoleLimit: (props: WouldExceedRoleLimit) => Promise<boolean>;
            }

            interface ExternalContract extends Pick<InternalContract, "findUniqueOrThrow" | "findMany"> {}

            type WouldExceedRoleLimit = {
                transaction?: EntityManager;
                account: string;
                roles: string[];
            };
        }
    }
}
