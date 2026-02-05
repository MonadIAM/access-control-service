import { QueryOrderKeys, EntityManager, FilterQuery, FindOptions } from "@mikro-orm/postgresql";

import { RoleClosure as RoleClosureEntity, Role as RoleEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace RoleClosure {
            interface Contract {
                insertNewHierarchy: (props: InsertNewHierarchy) => Promise<void>;
                moveSubtrees: (props: MoveSubtrees) => Promise<void>;
                rebuildTransitivePathsOnCollapse: (props: RebuildTransitivePathsOnCollapse) => Promise<void>;
                deleteTransitivePathsOnCollapse: (props: DeleteTransitivePathsOnCollapse) => Promise<void>;
                findAncestors: (props: FindAncestors) => Promise<[RoleEntity[], number]>;
                findDescendants: (props: FindDescendants) => Promise<[RoleEntity[], number]>;
            }

            type InsertNewHierarchy = {
                transaction?: EntityManager;
                descendant: string;
                ancestor: string;
                realm: string;
            };

            type MoveSubtrees = {
                transaction?: EntityManager;
                oldParent: string;
                newParent: string;
                children: string[];
                realm: string;
            };

            type RebuildTransitivePathsOnCollapse = {
                transaction?: EntityManager;
                deletedRole: string;
                newAncestor: string;
                realm: string;
            };

            type DeleteTransitivePathsOnCollapse = {
                transaction?: EntityManager;
                realm: string;
                role: string;
            };

            type FindAncestors = {
                transaction?: EntityManager;
                options?: FindOptions<RoleClosureEntity>;
                roleOrderBy?: QueryOrderKeys<RoleEntity>;
                roleWhere?: FilterQuery<RoleEntity>;
                descendant: string;
                depth?: number;
            };

            type FindDescendants = {
                transaction?: EntityManager;
                options?: FindOptions<RoleClosureEntity>;
                roleOrderBy?: QueryOrderKeys<RoleEntity>;
                roleWhere?: FilterQuery<RoleEntity>;
                ancestor: string;
                depth?: number;
            };
        }
    }
}
