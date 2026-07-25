import { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";

import datasets from "../../datasets";

export class System extends Seeder {
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
                access_control.realm,
                system.outbox,
                system.change_log,
                system.audit_log
            RESTART IDENTITY CASCADE
        `);

        await entityManager.insertMany("access_control.realm", datasets.Realms.postgresql);
        await entityManager.insertMany("access_control.permission", datasets.Permissions.postgresql);
        await entityManager.insertMany("access_control.role", datasets.Roles.postgresql);
        await entityManager.insertMany("access_control.role_closure", datasets.RoleClosures.postgresql);
        await entityManager.insertMany(
            "access_control.role_permission_assignment",
            datasets.RolePermissionAssignments.postgresql,
        );
        await entityManager.insertMany(
            "access_control.account_role_assignment",
            datasets.AccountRoleAssignments.postgresql,
        );
    }
}
