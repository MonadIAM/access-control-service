declare namespace Repositories {
    namespace RoleClosure {
        interface Contract extends PublicContract {}

        interface PublicContract {
            decreaseTransitiveDepth: DecreaseTransitiveDepth.Signature;
            existsTransitivePath: ExistsTransitivePath.Signature;
            insertNewHierarchy: InsertNewHierarchy.Signature;
            moveSubtrees: MoveSubtrees.Signature;
            move: Move.Signature;
        }

        namespace DecreaseTransitiveDepth {
            type Props = {
                transaction: ORM.EntityManager;
                realm: string;
                role: string;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace ExistsTransitivePath {
            type Props = {
                transaction: ORM.EntityManager;
                descendant: string;
                ancestor: string;
                realm: string;
            };

            type Result = Promise<boolean>;

            type Signature = (props: Props) => Result;
        }

        namespace InsertNewHierarchy {
            type Props = {
                transaction: ORM.EntityManager;
                descendant: string;
                ancestor: string;
                realm: string;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace MoveSubtrees {
            type Props = {
                transaction: ORM.EntityManager;
                oldParent: string;
                newParent: string;
                children: string[];
                realm: string;
            };

            type Result = Promise<{
                removedPaths: Omit<Entities.RoleClosure, "realm" | "depth">[];
                upsertedPaths: Omit<Entities.RoleClosure, "realm">[];
            }>;

            type Signature = (props: Props) => Result;
        }

        namespace Move {
            type Props = {
                transaction: ORM.EntityManager;
                newParent: string;
                target: string;
                realm: string;
            };

            type Result = Promise<{
                removedPaths: Omit<Entities.RoleClosure, "realm" | "depth">[];
                upsertedPaths: Omit<Entities.RoleClosure, "realm">[];
            }>;

            type Signature = (props: Props) => Result;
        }
    }
}
