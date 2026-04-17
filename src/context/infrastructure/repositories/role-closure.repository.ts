import { Injectable, Scope } from "@nestjs/common";
import { Knex } from "@mikro-orm/postgresql";

import { RepositoryException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleClosureRepository implements Repositories.RoleClosure.Contract {
    public async insertNewHierarchy({
        transaction,
        descendant,
        ancestor,
        realm,
    }: Repositories.RoleClosure.InsertNewHierarchy): Promise<void> {
        try {
            const context = transaction.getTransactionContext();
            const knex = transaction.getKnex();

            await knex("access_control.role_closure")
                .transacting(context)
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
                );
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.constructor.name);
        }
    }

    public async moveSubtrees({
        transaction,
        oldParent,
        newParent,
        children,
        realm,
    }: Repositories.RoleClosure.MoveSubtrees): Promise<void> {
        try {
            const context = transaction.getTransactionContext();
            const knex = transaction.getKnex();

            await knex("access_control.role_closure as closure")
                .transacting(context)
                .where("closure.realm_id", realm)
                .whereIn("closure.descendant_id", (builder: Knex.QueryBuilder) => {
                    builder
                        .select("descendant_id")
                        .from("access_control.role_closure")
                        .whereIn("ancestor_id", children)
                        .andWhere("realm_id", realm);
                })
                .whereIn("closure.ancestor_id", (builder: Knex.QueryBuilder) => {
                    builder
                        .select("ancestor_id")
                        .from("access_control.role_closure")
                        .where("descendant_id", oldParent)
                        .andWhere("realm_id", realm);
                })
                .delete();

            await knex("access_control.role_closure")
                .transacting(context)
                .insert((builder: Knex.QueryBuilder) => {
                    builder
                        .select(
                            knex.raw("?::uuid as realm_id", [realm]),
                            "new_parent_paths.ancestor_id",
                            "moved_subtree_paths.descendant_id",
                            knex.raw("new_parent_paths.depth + moved_subtree_paths.depth + 1 as depth"),
                        )
                        .from("access_control.role_closure AS new_parent_paths")
                        .join("access_control.role_closure AS moved_subtree_paths", (join: Knex.JoinClause) => {
                            join.onIn("moved_subtree_paths.ancestor_id", children).andOn(
                                "moved_subtree_paths.realm_id",
                                "=",
                                knex.raw("?::uuid", [realm]),
                            );
                        })
                        .where("new_parent_paths.descendant_id", newParent)
                        .andWhere("new_parent_paths.realm_id", realm);
                });
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.constructor.name);
        }
    }

    public async decreaseTransitiveDepth({
        transaction,
        realm,
        role,
    }: Repositories.RoleClosure.DecreaseTransitiveDepth): Promise<void> {
        try {
            const knex = transaction.getKnex();
            const context = transaction.getTransactionContext()!;

            await knex("access_control.role_closure")
                .transacting(context)
                .where("realm_id", realm)
                .whereExists((builder: Knex.QueryBuilder) => {
                    builder
                        .select(knex.raw("1"))
                        .from("access_control.role_closure as path1")
                        .join("access_control.role_closure as path2", (join: Knex.JoinClause) => {
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
                });
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.constructor.name);
        }
    }
}
