import { Injectable, Scope } from "@nestjs/common";

import { RoleClosure, Role } from "~context/domain/entities";
import { ExceptionMapper } from "~common/exceptions";
import { knex } from "~infrastructure/database";

@Injectable({ scope: Scope.DEFAULT })
export class RoleClosureRepository implements Repositories.RoleClosure.Contract {
    private readonly resource = RoleClosure.name;

    public async insertNewHierarchy(
        props: Repositories.RoleClosure.InsertNewHierarchy.Props,
    ): Repositories.RoleClosure.InsertNewHierarchy.Result {
        try {
            const { transaction, descendant, ancestor, realm } = props;

            // NOTE[SQL-01]: see NOTES.md#SQL-01
            const query = knex("access_control.role_closure")
                .insert(
                    knex
                        .select(
                            knex.raw("?::uuid as realm_id", [realm]),
                            "closure.ancestor_id",
                            knex.raw("?::uuid as descendant_id", [descendant]),
                            knex.raw("closure.depth + 1 as depth"),
                        )
                        .from("access_control.role_closure as closure")
                        .where("closure.descendant_id", ancestor)
                        .andWhere("closure.realm_id", realm)
                        .unionAll(
                            knex.select(
                                knex.raw("?::uuid as realm_id", [realm]),
                                knex.raw("?::uuid as ancestor_id", [descendant]),
                                knex.raw("?::uuid as descendant_id", [descendant]),
                                knex.raw("0 as depth"),
                            ),
                        ),
                )
                .toSQL();

            await transaction.execute(query.sql, [...query.bindings], "run");
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
            const deleteQuery = knex("access_control.role_closure as closure")
                .where("closure.realm_id", realm)
                .whereIn("closure.descendant_id", (builder) => {
                    builder
                        .select("descendant_id")
                        .from("access_control.role_closure")
                        .whereIn("ancestor_id", children)
                        .andWhere("realm_id", realm);
                })
                .whereIn("closure.ancestor_id", (builder) => {
                    builder
                        .select("ancestor_id")
                        .from("access_control.role_closure")
                        .where("descendant_id", oldParent)
                        .andWhere("realm_id", realm);
                })
                .delete()
                .returning(["ancestor_id", "descendant_id"])
                .toSQL();

            const removedRows = await transaction.execute<Repositories.RoleClosure.RemovedRow[]>(
                deleteQuery.sql,
                [...deleteQuery.bindings],
                "all",
            );

            // NOTE[SQL-02]: see NOTES.md#SQL-02
            const insertQuery = knex("access_control.role_closure")
                .insert(
                    knex
                        .select(
                            knex.raw("?::uuid as realm_id", [realm]),
                            "new_parent_paths.ancestor_id",
                            "moved_subtree_paths.descendant_id",
                            knex.raw("new_parent_paths.depth + moved_subtree_paths.depth + 1 as depth"),
                        )
                        .from("access_control.role_closure as new_parent_paths")
                        .join("access_control.role_closure as moved_subtree_paths", (join) => {
                            join.onIn("moved_subtree_paths.ancestor_id", children).andOn(
                                "moved_subtree_paths.realm_id",
                                "=",
                                knex.raw("?::uuid", [realm]),
                            );
                        })
                        .where("new_parent_paths.descendant_id", newParent)
                        .andWhere("new_parent_paths.realm_id", realm),
                )
                .returning(["ancestor_id", "descendant_id", "depth"])
                .toSQL();

            const upsertedRows = await transaction.execute<Repositories.RoleClosure.UpsertedRow[]>(
                insertQuery.sql,
                [...insertQuery.bindings],
                "all",
            );

            return {
                upsertedPaths: upsertedRows.map((row) => ({
                    descendant: transaction.getReference(Role, row.descendant_id),
                    ancestor: transaction.getReference(Role, row.ancestor_id),
                    depth: Number(row.depth),
                })),
                removedPaths: removedRows.map((row) => ({
                    descendant: transaction.getReference(Role, row.descendant_id),
                    ancestor: transaction.getReference(Role, row.ancestor_id),
                })),
            };
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
            // NOTE[SQL-03]: see NOTES.md#SQL-03
            const query = knex("access_control.role_closure")
                .where("realm_id", realm)
                .whereNot("ancestor_id", role)
                .whereNot("descendant_id", role)
                .whereExists((builder) => {
                    builder
                        .select(knex.raw("1"))
                        .from("access_control.role_closure as path1")
                        .join("access_control.role_closure as path2", (join) => {
                            join.on("path1.descendant_id", "=", knex.raw("?::uuid", [role]))
                                .andOn("path2.ancestor_id", "=", knex.raw("?::uuid", [role]))
                                .andOn("path1.realm_id", "=", knex.raw("?::uuid", [realm]))
                                .andOn("path2.realm_id", "=", knex.raw("?::uuid", [realm]));
                        })
                        .whereRaw("path1.ancestor_id = role_closure.ancestor_id")
                        .whereRaw("path2.descendant_id = role_closure.descendant_id");
                })
                .update({
                    depth: knex.raw("depth - 1"),
                })
                .toSQL();

            await transaction.execute(query.sql, [...query.bindings], "run");
        } catch (error) {
            throw ExceptionMapper.fromORM(error, this.resource);
        }
    }

    public async move(props: Repositories.RoleClosure.Move.Props): Repositories.RoleClosure.Move.Result {
        try {
            const { transaction, newParent, target, realm } = props;
            const closureTable = "access_control.role_closure";

            const subtree = knex(`${closureTable} as closure`)
                .select("closure.descendant_id", { subtree_depth: "closure.depth" })
                .where("closure.ancestor_id", target)
                .andWhere("closure.realm_id", realm);

            const oldAncestors = knex(`${closureTable} as closure`)
                .select("closure.ancestor_id")
                .where("closure.descendant_id", target)
                .andWhere("closure.depth", ">", 0)
                .andWhere("closure.realm_id", realm);

            const newAncestors = knex(`${closureTable} as closure`)
                .select("closure.ancestor_id", { ancestor_depth: "closure.depth" })
                .where("closure.descendant_id", newParent)
                .andWhere("closure.realm_id", realm);

            // NOTE[SQL-04]: see NOTES.md#SQL-04
            const selectQuery = knex(closureTable)
                .with("subtree", subtree)
                .with("old_ancestors", oldAncestors)
                .with("new_ancestors", newAncestors)
                .select("ancestor_id", "descendant_id")
                .where("realm_id", realm)
                .whereIn("descendant_id", knex("subtree").select("descendant_id"))
                .whereIn("ancestor_id", knex("old_ancestors").select("ancestor_id"))
                .whereNotIn("ancestor_id", knex("new_ancestors").select("ancestor_id"))
                .toSQL();

            const removedRows = await transaction.execute<Repositories.RoleClosure.RemovedRow[]>(
                selectQuery.sql,
                [...selectQuery.bindings],
                "all",
            );

            const detached = knex(closureTable)
                .where("realm_id", realm)
                .whereIn("descendant_id", knex("subtree").select("descendant_id"))
                .whereIn("ancestor_id", knex("old_ancestors").select("ancestor_id"))
                .whereNotIn("ancestor_id", knex("new_ancestors").select("ancestor_id"))
                .del();

            const reattached = knex
                .from("new_ancestors")
                .crossJoin(knex.raw("subtree"))
                .select(
                    knex.raw("?::uuid as realm_id", [realm]),
                    "new_ancestors.ancestor_id",
                    "subtree.descendant_id",
                    knex.raw("new_ancestors.ancestor_depth + subtree.subtree_depth + 1 as depth"),
                );

            // NOTE[SQL-04]: see NOTES.md#SQL-04
            const upsertQuery = knex(closureTable)
                .with("subtree", subtree)
                .with("old_ancestors", oldAncestors)
                .with("new_ancestors", newAncestors)
                .with("detached", detached)
                .insert(reattached)
                .onConflict(["realm_id", "ancestor_id", "descendant_id"])
                .merge(["depth"])
                .returning(["ancestor_id", "descendant_id", "depth"])
                .toSQL();

            const upsertedRows = await transaction.execute<Repositories.RoleClosure.UpsertedRow[]>(
                upsertQuery.sql,
                [...upsertQuery.bindings],
                "all",
            );

            return {
                upsertedPaths: upsertedRows.map((row) => ({
                    descendant: transaction.getReference(Role, row.descendant_id),
                    ancestor: transaction.getReference(Role, row.ancestor_id),
                    depth: Number(row.depth),
                })),
                removedPaths: removedRows.map((row) => ({
                    descendant: transaction.getReference(Role, row.descendant_id),
                    ancestor: transaction.getReference(Role, row.ancestor_id),
                })),
            };
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
