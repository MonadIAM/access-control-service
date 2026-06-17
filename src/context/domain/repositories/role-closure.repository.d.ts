import { EntityManager } from "@mikro-orm/postgresql";

declare global {
    namespace Repositories {
        namespace RoleClosure {
            interface Contract {
                decreaseTransitiveDepth(props: DecreaseTransitiveDepth.Props): DecreaseTransitiveDepth.Result;
                existsTransitivePath(props: ExistsTransitivePath.Props): ExistsTransitivePath.Result;
                insertNewHierarchy(props: InsertNewHierarchy.Props): InsertNewHierarchy.Result;
                moveSubtrees(props: MoveSubtrees.Props): MoveSubtrees.Result;
                move(props: Move.Props): Move.Result;
            }

            namespace Move {
                type Props = {
                    transaction: EntityManager;
                    newParent: string;
                    target: string;
                    realm: string;
                };

                type Result = Promise<{
                    removedPaths: Omit<Entities.RoleClosure, "realm" | "depth">[];
                    upsertedPaths: Omit<Entities.RoleClosure, "realm">[];
                }>;
            }

            namespace MoveSubtrees {
                type Props = {
                    transaction: EntityManager;
                    oldParent: string;
                    newParent: string;
                    children: string[];
                    realm: string;
                };

                type Result = Promise<{
                    removedPaths: Omit<Entities.RoleClosure, "realm" | "depth">[];
                    upsertedPaths: Omit<Entities.RoleClosure, "realm">[];
                }>;
            }

            namespace InsertNewHierarchy {
                type Props = {
                    transaction: EntityManager;
                    descendant: string;
                    ancestor: string;
                    realm: string;
                };

                type Result = Promise<void>;
            }

            namespace DecreaseTransitiveDepth {
                type Props = {
                    transaction: EntityManager;
                    realm: string;
                    role: string;
                };

                type Result = Promise<void>;
            }

            namespace ExistsTransitivePath {
                type Props = {
                    transaction: EntityManager;
                    descendant: string;
                    ancestor: string;
                    realm: string;
                };

                type Result = Promise<boolean>;
            }
        }
    }
}
