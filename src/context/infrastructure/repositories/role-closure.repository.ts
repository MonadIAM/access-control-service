import { EntityManager, Knex } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable, Scope } from "@nestjs/common";

import { RepositoryException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class RoleClosureRepository {
    private readonly resource = "RoleClosure";

    public constructor(@InjectEntityManager("write") private readonly writeManager: EntityManager) {}

    public async insertNewHierarchy({
        transaction,
        descendant,
        ancestor,
        realm,
    }: Repositories.RoleClosure.InsertNewHierarchy): Promise<void> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();
            const knex = entityManager.getKnex();

            await knex("access_control.role_closure").insert({
                descendant_id: descendant,
                ancestor_id: descendant,
                realm_id: realm,
                depth: 0,
            });

            await knex("access_control.role_closure").insert((builder: Knex.QueryBuilder) => {
                builder
                    .select(
                        knex.raw("? as realm_id", [realm]),
                        "RC.ancestor_id",
                        knex.raw("? as descendant_id", [descendant]),
                        knex.raw("RC.depth + 1"),
                    )
                    .from("access_control.role_closure AS RC")
                    .where("RC.descendant_id", ancestor)
                    .andWhere("RC.realm_id", realm);
            });
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
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
            const entityManager = transaction ?? this.writeManager.fork();
            const knex = entityManager.getKnex();

            await knex("access_control.role_closure as RC")
                .where("RC.realm_id", realm)
                .whereIn("RC.descendant_id", (builder: Knex.QueryBuilder) => {
                    builder
                        .select("descendant_id")
                        .from("access_control.role_closure")
                        .whereIn("ancestor_id", children)
                        .andWhere("realm_id", realm);
                })
                .whereIn("RC.ancestor_id", (builder: Knex.QueryBuilder) => {
                    builder
                        .select("ancestor_id")
                        .from("access_control.role_closure")
                        .where("descendant_id", oldParent)
                        .andWhere("realm_id", realm);
                })
                .delete();

            await knex("access_control.role_closure").insert((builder: Knex.QueryBuilder) => {
                builder
                    .select(
                        knex.raw("? as realm_id", [realm]),
                        "A.ancestor_id",
                        "D.descendant_id",
                        knex.raw("A.depth + D.depth + 1"),
                    )
                    .from("access_control.role_closure AS A")
                    .join("access_control.role_closure AS D", (join: Knex.JoinClause) => {
                        join.onIn("D.ancestor_id", children).andOn("D.realm_id", "=", knex.raw("?", [realm]));
                    })
                    .where("A.descendant_id", newParent)
                    .andWhere("A.realm_id", realm);
            });
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async rebuildTransitivePathsOnCollapse({
        transaction,
        deletedRole,
        newAncestor,
        realm,
    }: Repositories.RoleClosure.RebuildTransitivePathsOnCollapse): Promise<void> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();
            const knex = entityManager.getKnex();

            await knex("access_control.role_closure").insert((builder: Knex.QueryBuilder) => {
                builder
                    .select(
                        knex.raw("? as realm_id", [realm]),
                        "A.ancestor_id",
                        "D.descendant_id",
                        knex.raw("A.depth + D.depth"),
                    )
                    .from("access_control.role_closure AS A")
                    .join("access_control.role_closure AS D", (join) => {
                        join.on(knex.raw("D.ancestor_id = ?", [deletedRole])).andOn(
                            "D.realm_id",
                            "=",
                            knex.raw("?", [realm]),
                        );
                    })
                    .where("A.descendant_id", newAncestor)
                    .andWhere("A.realm_id", realm)
                    .andWhere("D.descendant_id", "!=", deletedRole);
            });
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }

    public async deleteTransitivePathsOnCollapse({
        transaction,
        realm,
        role,
    }: Repositories.RoleClosure.DeleteTransitivePathsOnCollapse): Promise<void> {
        try {
            const entityManager = transaction ?? this.writeManager.fork();
            const knex = entityManager.getKnex();

            await knex("access_control.role_closure AS RC")
                .where("RC.realm_id", realm)
                .join("access_control.role_closure AS A", (join: Knex.JoinClause) => {
                    join.on("A.descendant_id", "=", knex.raw("?", [role]))
                        .andOn("A.ancestor_id", "=", "RC.ancestor_id")
                        .andOn("A.realm_id", "=", knex.raw("?", [realm]));
                })
                .join("access_control.role_closure AS D", (join: Knex.JoinClause) => {
                    join.on("D.ancestor_id", "=", knex.raw("?", [role]))
                        .andOn("D.descendant_id", "=", "RC.descendant_id")
                        .andOn("D.realm_id", "=", knex.raw("?", [realm]));
                })
                .delete();
        } catch (error) {
            throw RepositoryException.fromOrmError(error, this.resource);
        }
    }
}
