import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Repositories {
        namespace RoleClosure {
            interface Contract {
                decreaseTransitiveDepth: (props: DecreaseTransitiveDepth) => Promise<void>;
                moveSubtrees: (props: MoveSubtrees.Props) => Promise<MoveSubtrees.Result>;
                existsTransitivePath: (props: ExistsTransitivePath) => Promise<boolean>;
                insertNewHierarchy: (props: InsertNewHierarchy) => Promise<void>;
                move: (props: Move.Props) => Promise<Move.Result>;
            }

            namespace Move {
                type Props = {
                    transaction: EntityManager;
                    newParent: string;
                    target: string;
                    realm: string;
                };

                type Result = {
                    removedPaths: Omit<Entities.RoleClosure, "realm" | "depth">[];
                    upsertedPaths: Omit<Entities.RoleClosure, "realm">[];
                };
            }

            namespace MoveSubtrees {
                type Props = {
                    transaction: EntityManager;
                    oldParent: string;
                    newParent: string;
                    children: string[];
                    realm: string;
                };

                type Result = {
                    removedPaths: Omit<Entities.RoleClosure, "realm" | "depth">[];
                    upsertedPaths: Omit<Entities.RoleClosure, "realm">[];
                };
            }

            type InsertNewHierarchy = {
                transaction: EntityManager;
                descendant: string;
                ancestor: string;
                realm: string;
            };

            type DecreaseTransitiveDepth = {
                transaction: EntityManager;
                realm: string;
                role: string;
            };

            type ExistsTransitivePath = {
                transaction: EntityManager;
                descendant: string;
                ancestor: string;
                realm: string;
            };
        }
    }
}
