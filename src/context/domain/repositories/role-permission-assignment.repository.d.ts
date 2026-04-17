import { EntityManager } from "@mikro-orm/postgresql";

import { RolePermissionAssignment as RolePermissionAssignmentEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace RolePermissionAssignment {
            type Entity = RolePermissionAssignmentEntity;

            interface InternalContract extends Repositories.Base.Contract<Entity, Adapters.RolePermissionAssignment.Types> {
                wouldExceedPermissionLimit: (props: WouldExceedPermissionLimit) => Promise<boolean>;
            }

            interface ExternalContract extends Pick<InternalContract, "findUniqueOrThrow" | "findMany"> {}

            type WouldExceedPermissionLimit = {
                transaction?: EntityManager;
                permissions: string[];
                role: string;
            };
        }
    }
}
