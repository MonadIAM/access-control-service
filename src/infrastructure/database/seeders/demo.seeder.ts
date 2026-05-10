import { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";

import datasets from "../../datasets/demo";

export class DemoSeeder extends Seeder {
    public async run(entityManager: EntityManager): Promise<void> {
        await entityManager.insertMany("access_control.realm", datasets.Realms);
        await entityManager.insertMany("access_control.permission", datasets.Permissions);
        await entityManager.insertMany("access_control.role", datasets.Roles);
        await entityManager.insertMany("access_control.role_closure", datasets.RoleClosures);
        await entityManager.insertMany("access_control.role_permission_assignment", datasets.RolePermissionAssignments);
        await entityManager.insertMany("access_control.account_role_assignment", datasets.AccountRoleAssignments);
        await entityManager.insertMany("access_control.role_delegation_policy", datasets.RoleDelegationPolicies);
        await entityManager.insertMany("access_control.role_conflict_group", datasets.RoleConflictGroups);
        await entityManager.insertMany("access_control.role_conflict_member", datasets.RoleConflictMembers);
    }
}
