export class PostgresHelpers implements Integration.Postgres.Helpers.Contract {
    public async getRoleClosurePathKeys(
        props: Integration.Postgres.Helpers.GetRoleClosurePathKeys.Props,
    ): Integration.Postgres.Helpers.GetRoleClosurePathKeys.Result {
        const rows = await props.transaction.execute<Integration.Postgres.Helpers.RoleClosurePathRow[]>(
            `
                SELECT ancestor_id, descendant_id, depth
                FROM access_control.role_closure
                WHERE realm_id = ?
                ORDER BY ancestor_id, descendant_id, depth
            `,
            [props.realm],
            "all",
        );

        return rows
            .map(({ ancestor_id, descendant_id, depth }) => `${ancestor_id}:${descendant_id}:${Number(depth)}`)
            .sort();
    }
}
