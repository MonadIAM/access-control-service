import { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";

import {
    RolePermissionAssignments,
    RoleDelegationPolicies,
    RoleConflictMembers,
    RoleConflictGroups,
    RoleClosures,
    Permissions,
    Realms,
    Roles,
} from "../datasets/demo";

export class DemoSeeder extends Seeder {
    public async run(entityManager: EntityManager): Promise<void> {
        await entityManager.insertMany("access_control.realm", Realms);
        await entityManager.insertMany("access_control.permission", Permissions);
        await entityManager.insertMany("access_control.role", Roles);
        await entityManager.insertMany("access_control.role_closure", RoleClosures);
        await entityManager.insertMany("access_control.role_conflict_group", RoleConflictGroups);
        await entityManager.insertMany("access_control.role_conflict_member", RoleConflictMembers);
        await entityManager.insertMany("access_control.role_permission_assignment", RolePermissionAssignments);
        await entityManager.insertMany("access_control.role_delegation_policy", RoleDelegationPolicies);
    }
}
