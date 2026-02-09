import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Repositories {
        namespace RoleClosure {
            interface Contract {
                insertNewHierarchy: (props: InsertNewHierarchy) => Promise<void>;
                moveSubtrees: (props: MoveSubtrees) => Promise<void>;
                rebuildTransitivePathsOnCollapse: (props: RebuildTransitivePathsOnCollapse) => Promise<void>;
                deleteTransitivePathsOnCollapse: (props: DeleteTransitivePathsOnCollapse) => Promise<void>;
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
        }
    }
}
