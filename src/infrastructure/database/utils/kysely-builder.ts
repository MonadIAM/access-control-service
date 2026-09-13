import { PostgresIntrospector, PostgresQueryCompiler, PostgresAdapter, DummyDriver, Kysely } from "kysely";

class ORMQueryCompiler extends PostgresQueryCompiler {
    protected override getCurrentParameterPlaceholder(): string {
        return "?";
    }
}

/**
 * @public
 * kysely used purely as an SQL compiler (postgres dialect, no connection).
 *
 * No connection is ever opened and this instance never executes queries itself - build a query
 * and call `.compile()`, nothing more. Execution always goes through `EntityManager.execute()`;
 * the transaction context is owned by mikro-orm.
 *
 * See NOTES.md#SQL.
 */
export const kysely = new Kysely<ORM.Database>({
    dialect: {
        createIntrospector: (database: Kysely<ORM.Database>) => new PostgresIntrospector(database),
        createQueryCompiler: () => new ORMQueryCompiler(),
        createAdapter: () => new PostgresAdapter(),
        createDriver: () => new DummyDriver(),
    },
});
