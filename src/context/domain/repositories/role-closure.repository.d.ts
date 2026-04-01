import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Repositories {
        namespace RoleClosure {
            interface Contract {
                decreaseTransitiveDepth: (props: DecreaseTransitiveDepth) => Promise<void>;
                insertNewHierarchy: (props: InsertNewHierarchy) => Promise<void>;
                moveSubtrees: (props: MoveSubtrees) => Promise<void>;
            }

            type InsertNewHierarchy = {
                transaction: EntityManager;
                descendant: string;
                ancestor: string;
                realm: string;
            };

            type MoveSubtrees = {
                transaction: EntityManager;
                oldParent: string;
                newParent: string;
                children: string[];
                realm: string;
            };

            type DecreaseTransitiveDepth = {
                transaction: EntityManager;
                realm: string;
                role: string;
            };
        }
    }
}
