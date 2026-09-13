import { sql } from "kysely";

import { kysely } from "~infrastructure/database";

const CLOSURE_COLUMNS = ["realm_id", "ancestor_id", "descendant_id", "depth"] as const;

export class TrackedWritesHelper implements Integration.TrackedWritesHelper.Contract {
    public insertPathQuery(
        props: Integration.TrackedWritesHelper.InsertPathQuery.Props,
    ): Integration.TrackedWritesHelper.InsertPathQuery.Result {
        return kysely
            .insertInto("access_control.role_closure")
            .values({
                descendant_id: props.descendant,
                ancestor_id: props.ancestor,
                realm_id: props.realm,
                depth: props.depth,
            })
            .returning(CLOSURE_COLUMNS)
            .compile();
    }

    public deletePathsQuery(
        props: Integration.TrackedWritesHelper.DeletePathsQuery.Props,
    ): Integration.TrackedWritesHelper.DeletePathsQuery.Result {
        return kysely
            .deleteFrom("access_control.role_closure")
            .where("realm_id", "=", props.realm)
            .returning(CLOSURE_COLUMNS)
            .compile();
    }

    public increaseDepthQuery(
        props: Integration.TrackedWritesHelper.IncreaseDepthQuery.Props,
    ): Integration.TrackedWritesHelper.IncreaseDepthQuery.Result {
        return kysely
            .updateTable("access_control.role_closure")
            .set({ depth: sql<number>`depth + 1` })
            .where("realm_id", "=", props.realm)
            .returning([...CLOSURE_COLUMNS, sql`jsonb_build_object('depth', depth - 1)`.as("previous_state")])
            .compile();
    }

    public upsertPathsQuery(
        props: Integration.TrackedWritesHelper.UpsertPathsQuery.Props,
    ): Integration.TrackedWritesHelper.UpsertPathsQuery.Result {
        return kysely
            .with(
                (cte) => cte("previous").materialized(),
                (creator) =>
                    creator
                        .selectFrom("access_control.role_closure")
                        .select(["ancestor_id", "descendant_id", "depth"])
                        .where(
                            "realm_id",
                            "in",
                            props.paths.map(({ realm }) => realm),
                        ),
            )
            .with("upserted", (creator) =>
                creator
                    .insertInto("access_control.role_closure")
                    .values(
                        props.paths.map((path) => ({
                            descendant_id: path.descendant,
                            ancestor_id: path.ancestor,
                            realm_id: path.realm,
                            depth: path.depth,
                        })),
                    )
                    .onConflict((conflict) =>
                        conflict.columns(["realm_id", "ancestor_id", "descendant_id"]).doUpdateSet((eb) => ({
                            depth: eb.ref("excluded.depth"),
                        })),
                    )
                    .returning(CLOSURE_COLUMNS),
            )
            .selectFrom("upserted")
            .leftJoin("previous", (join) =>
                join
                    .onRef("previous.ancestor_id", "=", "upserted.ancestor_id")
                    .onRef("previous.descendant_id", "=", "upserted.descendant_id"),
            )
            .select([
                "upserted.realm_id",
                "upserted.ancestor_id",
                "upserted.descendant_id",
                "upserted.depth",
                sql`to_jsonb(previous)`.as("previous_state"),
            ])
            .compile();
    }
}
