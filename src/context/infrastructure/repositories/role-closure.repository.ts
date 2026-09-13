import { ChangeSetType } from "@mikro-orm/postgresql";
import { Injectable, Scope } from "@nestjs/common";
import { sql } from "kysely";

import { RoleClosure } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { kysely } from "~infrastructure/database";
import { TrackedWrites } from "~common/mixins";

const CLOSURE_COLUMNS = ["realm_id", "ancestor_id", "descendant_id", "depth"] as const;

@Injectable({ scope: Scope.DEFAULT })
export class RoleClosureRepository
    extends TrackedWrites<Entities.RoleClosure>({ Entity: RoleClosure })
    implements Repositories.RoleClosure.Contract
{
    private readonly resource = RoleClosure.name;

    public async insertNewHierarchy(
        props: Repositories.RoleClosure.InsertNewHierarchy.Props,
    ): Repositories.RoleClosure.InsertNewHierarchy.Result {
        try {
            const { transaction, descendant, ancestor, realm } = props;

            // NOTE[SQL-01]: see NOTES.md#SQL-01
            const query = kysely
                .insertInto("access_control.role_closure")
                .columns(CLOSURE_COLUMNS)
                .expression(
                    kysely
                        .selectFrom("access_control.role_closure as closure")
                        .select([
                            sql<string>`${realm}::uuid`.as("realm_id"),
                            "closure.ancestor_id",
                            sql<string>`${descendant}::uuid`.as("descendant_id"),
                            sql<number>`closure.depth + 1`.as("depth"),
                        ])
                        .where("closure.descendant_id", "=", ancestor)
                        .where("closure.realm_id", "=", realm)
                        .unionAll(
                            kysely.selectNoFrom([
                                sql<string>`${realm}::uuid`.as("realm_id"),
                                sql<string>`${descendant}::uuid`.as("ancestor_id"),
                                sql<string>`${descendant}::uuid`.as("descendant_id"),
                                sql<number>`0`.as("depth"),
                            ]),
                        ),
                )
                .returning(CLOSURE_COLUMNS)
                .compile();

            await super.write({ transaction, query, type: ChangeSetType.CREATE });
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async moveSubtrees(
        props: Repositories.RoleClosure.MoveSubtrees.Props,
    ): Repositories.RoleClosure.MoveSubtrees.Result {
        try {
            const { transaction, oldParent, newParent, children, realm } = props;

            // NOTE[SQL-02]: see NOTES.md#SQL-02
            const deleteQuery = kysely
                .deleteFrom("access_control.role_closure as closure")
                .where("closure.realm_id", "=", realm)
                .where("closure.descendant_id", "in", (eb) =>
                    eb
                        .selectFrom("access_control.role_closure")
                        .select("descendant_id")
                        .where("ancestor_id", "in", children)
                        .where("realm_id", "=", realm),
                )
                .where("closure.ancestor_id", "in", (eb) =>
                    eb
                        .selectFrom("access_control.role_closure")
                        .select("ancestor_id")
                        .where("descendant_id", "=", oldParent)
                        .where("realm_id", "=", realm),
                )
                .returning(CLOSURE_COLUMNS)
                .compile();

            // NOTE[SQL-02]: see NOTES.md#SQL-02
            const insertQuery = kysely
                .insertInto("access_control.role_closure")
                .columns(CLOSURE_COLUMNS)
                .expression(
                    kysely
                        .selectFrom("access_control.role_closure as new_parent_paths")
                        .innerJoin("access_control.role_closure as moved_subtree_paths", (join) =>
                            join
                                .on("moved_subtree_paths.ancestor_id", "in", children)
                                .on("moved_subtree_paths.realm_id", "=", sql<string>`${realm}::uuid`),
                        )
                        .select([
                            sql<string>`${realm}::uuid`.as("realm_id"),
                            "new_parent_paths.ancestor_id",
                            "moved_subtree_paths.descendant_id",
                            sql<number>`new_parent_paths.depth + moved_subtree_paths.depth + 1`.as("depth"),
                        ])
                        .where("new_parent_paths.descendant_id", "=", newParent)
                        .where("new_parent_paths.realm_id", "=", realm),
                )
                .returning(CLOSURE_COLUMNS)
                .compile();

            const removedPaths = await super.write({ transaction, query: deleteQuery, type: ChangeSetType.DELETE });
            const upsertedPaths = await super.write({ transaction, query: insertQuery, type: ChangeSetType.CREATE });

            return { upsertedPaths, removedPaths };
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async decreaseTransitiveDepth(
        props: Repositories.RoleClosure.DecreaseTransitiveDepth.Props,
    ): Repositories.RoleClosure.DecreaseTransitiveDepth.Result {
        try {
            const { transaction, realm, role } = props;

            // NOTE[SQL-02]: see NOTES.md#SQL-02
            const query = kysely
                .updateTable("access_control.role_closure")
                .set({ depth: sql<number>`depth - 1` })
                .where("realm_id", "=", realm)
                .where("ancestor_id", "!=", role)
                .where("descendant_id", "!=", role)
                .where((eb) =>
                    eb.exists(
                        eb
                            .selectFrom("access_control.role_closure as path1")
                            .innerJoin("access_control.role_closure as path2", (join) =>
                                join
                                    .on("path1.descendant_id", "=", sql<string>`${role}::uuid`)
                                    .on("path2.ancestor_id", "=", sql<string>`${role}::uuid`)
                                    .on("path1.realm_id", "=", sql<string>`${realm}::uuid`)
                                    .on("path2.realm_id", "=", sql<string>`${realm}::uuid`),
                            )
                            .select(sql`1`.as("matched"))
                            .whereRef("path1.ancestor_id", "=", "access_control.role_closure.ancestor_id")
                            .whereRef("path2.descendant_id", "=", "access_control.role_closure.descendant_id"),
                    ),
                )
                .returning([...CLOSURE_COLUMNS, sql`jsonb_build_object('depth', depth + 1)`.as("previous_state")])
                .compile();

            await super.write({ transaction, query, type: ChangeSetType.UPDATE });
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async move(props: Repositories.RoleClosure.Move.Props): Repositories.RoleClosure.Move.Result {
        try {
            const { transaction, newParent, target, realm } = props;

            const subtree = kysely
                .selectFrom("access_control.role_closure as closure")
                .select(["closure.descendant_id", "closure.depth as subtree_depth"])
                .where("closure.ancestor_id", "=", target)
                .where("closure.realm_id", "=", realm);

            const oldAncestors = kysely
                .selectFrom("access_control.role_closure as closure")
                .select("closure.ancestor_id")
                .where("closure.descendant_id", "=", target)
                .where("closure.depth", ">", 0)
                .where("closure.realm_id", "=", realm);

            const newAncestors = kysely
                .selectFrom("access_control.role_closure as closure")
                .select(["closure.ancestor_id", "closure.depth as ancestor_depth"])
                .where("closure.descendant_id", "=", newParent)
                .where("closure.realm_id", "=", realm);

            // NOTE[SQL-02]: see NOTES.md#SQL-02
            const deleteQuery = kysely
                .with("subtree", () => subtree)
                .with("old_ancestors", () => oldAncestors)
                .with("new_ancestors", () => newAncestors)
                .deleteFrom("access_control.role_closure")
                .where("realm_id", "=", realm)
                .where("descendant_id", "in", (eb) => eb.selectFrom("subtree").select("descendant_id"))
                .where("ancestor_id", "in", (eb) => eb.selectFrom("old_ancestors").select("ancestor_id"))
                .where("ancestor_id", "not in", (eb) => eb.selectFrom("new_ancestors").select("ancestor_id"))
                .returning(CLOSURE_COLUMNS)
                .compile();

            const removedPaths = await super.write({ transaction, query: deleteQuery, type: ChangeSetType.DELETE });

            // NOTE[SQL-04]: see NOTES.md#SQL-04
            const upsertQuery = kysely
                .with("subtree", () => subtree)
                .with("new_ancestors", () => newAncestors)
                .with(
                    (cte) => cte("previous").materialized(),
                    (creator) =>
                        creator
                            .selectFrom("access_control.role_closure as closure")
                            .select(["closure.ancestor_id", "closure.descendant_id", "closure.depth"])
                            .where("closure.realm_id", "=", realm)
                            .where("closure.descendant_id", "in", (eb) => eb.selectFrom("subtree").select("descendant_id"))
                            .where("closure.ancestor_id", "in", (eb) =>
                                eb.selectFrom("new_ancestors").select("ancestor_id"),
                            ),
                )
                .with("upserted", (creator) =>
                    creator
                        .insertInto("access_control.role_closure")
                        .columns(CLOSURE_COLUMNS)
                        .expression((eb) =>
                            eb
                                .selectFrom(["new_ancestors", "subtree"])
                                .select([
                                    sql<string>`${realm}::uuid`.as("realm_id"),
                                    "new_ancestors.ancestor_id",
                                    "subtree.descendant_id",
                                    sql<number>`new_ancestors.ancestor_depth + subtree.subtree_depth + 1`.as("depth"),
                                ]),
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

            const upsertedPaths = await super.write({ transaction, query: upsertQuery, type: ChangeSetType.CREATE });

            return { upsertedPaths, removedPaths };
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async existsTransitivePath(
        props: Repositories.RoleClosure.ExistsTransitivePath.Props,
    ): Repositories.RoleClosure.ExistsTransitivePath.Result {
        try {
            const { transaction, descendant, ancestor, realm } = props;
            const total = await transaction.count(RoleClosure, { ancestor, descendant, realm });

            return total > 0;
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }
}
