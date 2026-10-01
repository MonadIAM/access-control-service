import { dataset } from "@monadiam/shared/datasets/access-control";
import { Seeder } from "@mikro-orm/seeder";

export class System extends Seeder {
    private readonly schema: string = "access_control";

    public async run(entityManager: ORM.EntityManager): Promise<void> {
        const platform = entityManager.getPlatform();

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

        const seedOrder = [
            dataset.Realms,
            dataset.Permissions,
            dataset.Roles,
            dataset.RoleClosures,
            dataset.RolePermissionAssignments,
            dataset.AccountRoleAssignments,
        ];

        for await (const entry of seedOrder) {
            const query = platform.createNativeQueryBuilder().into(`${this.schema}.${entry.name}`).insert(entry.postgresql);
            await entityManager.execute(query, [], "run");
        }
    }
}
