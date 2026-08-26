import { MoveMode, RoleActorType, RoleArchetype } from "~context/enums";

declare global {
    namespace Services {
        namespace Role {
            interface Contract extends InternalContract, CommandContract {}

            interface InternalContract {
                buildHierarchy: BuildHierarchy.Signature;
            }

            namespace BuildHierarchy {
                type Props = {
                    transaction: ORM.EntityManager;
                    input: {
                        children?: string[];
                        parent: Entities.Role;
                        entity: Entities.Role;
                        realm: string;
                    };
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            interface CommandContract {
                purgeSubtree: PurgeSubtree.Signature;
                restore: Restore.Signature;
                revoke: Revoke.Signature;
                update: Update.Signature;
                create: Create.Signature;
                purge: Purge.Signature;
                move: Move.Signature;
            }

            namespace PurgeSubtree {
                type Props = {
                    transaction: ORM.EntityManager;
                    entity: Entities.Role;
                    realm: string;
                };

                type Result = Promise<Entities.Role[]>;

                type Signature = (props: Props) => Result;
            }

            namespace Restore {
                type Props = {
                    entities: Entities.Role[];
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }

            namespace Create {
                type Props = {
                    transaction: ORM.EntityManager;
                    input: {
                        actorType: RoleActorType;
                        archetype: RoleArchetype;
                        parent: Entities.Role;
                        description?: string;
                        children?: string[];
                        code: string;
                        name: string;
                    };
                    realm: Entities.Realm;
                };

                type Result = Promise<Entities.Role>;

                type Signature = (props: Props) => Result;
            }

            namespace Update {
                type Props = {
                    patch: Partial<Entities.Role.MutableFields>;
                    entity: Entities.Role;
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }

            namespace Revoke {
                type Props = {
                    entities: Entities.Role[];
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }

            namespace Purge {
                type Props = {
                    transaction: ORM.EntityManager;
                    entity: Entities.Role;
                    realm: string;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Move {
                type Props = {
                    targetParent: Entities.Role;
                    transaction: ORM.EntityManager;
                    target: Entities.Role;
                    mode: MoveMode;
                    realm: string;
                };

                type Result = Promise<
                    {
                        removedPaths: Omit<Entities.RoleClosure, "realm" | "depth">[];
                        upsertedPaths: Omit<Entities.RoleClosure, "realm">[];
                    }[]
                >;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
