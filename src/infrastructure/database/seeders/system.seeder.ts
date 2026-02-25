import { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";

import {
    RolePermissionAssignments,
    AccountRoleAssignments,
    RoleClosures,
    Permissions,
    Realms,
    Roles,
} from "../datasets/system";

export class SystemSeeder extends Seeder {
    public async run(entityManager: EntityManager): Promise<void> {
        await entityManager.getConnection().execute(`
            TRUNCATE TABLE
                access_control.role_permission_assignment,
                access_control.role_closure,
                access_control.account_role_assignment,
                access_control.permission_override,
                access_control.role_delegation_policy,
                access_control.role_conflict_member,
                access_control.role_conflict_group,
                access_control.role,
                access_control.permission,
                access_control.realm
            RESTART IDENTITY CASCADE
        `);

        await entityManager.insertMany("access_control.realm", Realms);
        await entityManager.insertMany("access_control.permission", Permissions);
        await entityManager.insertMany("access_control.role", Roles);
        await entityManager.insertMany("access_control.role_closure", RoleClosures);
        await entityManager.insertMany("access_control.role_permission_assignment", RolePermissionAssignments);
        await entityManager.insertMany("access_control.account_role_assignment", AccountRoleAssignments);
    }
}
