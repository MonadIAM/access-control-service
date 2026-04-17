import { EntityManager } from "@mikro-orm/postgresql";

import { RoleConflictMember as RoleConflictMemberEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace RoleConflictMember {
            type Entity = RoleConflictMemberEntity;

            interface InternalContract extends Repositories.Base.Contract<Entity, Adapters.RoleConflictMember.Types> {
                wouldExceedMemberLimit: (props: WouldExceedMemberLimit) => Promise<boolean>;
            }

            interface ExternalContract extends Pick<InternalContract, "findUniqueOrThrow" | "findMany"> {}

            type WouldExceedMemberLimit = {
                transaction?: EntityManager;
                group: string;
                count: number;
            };
        }
    }
}
