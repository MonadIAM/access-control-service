import Knex from "knex";

/**
 * @public
 * knex used purely as an SQL compiler (`client: "pg"`, no connection).
 *
 * No connection is ever opened and this instance never executes queries itself - build a query
 * and call `.toSQL()`, nothing more. Execution always goes through `EntityManager.execute()`;
 * the transaction context is owned by mikro-orm.
 *
 * See NOTES.md#SQL.
 */
export const knex = Knex({ client: "pg" });
