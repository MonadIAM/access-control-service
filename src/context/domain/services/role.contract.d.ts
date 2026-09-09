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
                    realm: string;
                    id: string;
                };

                type Result = Promise<{
                    entities: Entities.Role[];
                    root: Entities.Role;
                }>;

                type Signature = (props: Props) => Result;
            }

            namespace Restore {
                type Props = {
                    transaction: ORM.EntityManager;
                    identifiers: string[];
                    realm: string;
                };

                type Result = Promise<Entities.Role[]>;

                type Signature = (props: Props) => Result;
            }

            namespace Create {
                type Props = {
                    transaction: ORM.EntityManager;
                    input: {
                        actorType: RoleActorType;
                        archetype: RoleArchetype;
                        description?: string;
                        children?: string[];
                        parent: string;
                        code: string;
                        name: string;
                    };
                    realm: string;
                };

                type Result = Promise<{
                    parent: Entities.Role;
                    entity: Entities.Role;
                }>;

                type Signature = (props: Props) => Result;
            }

            namespace Update {
                type Props = {
                    patch: Partial<Entities.Role.MutableFields>;
                    transaction: ORM.EntityManager;
                    realm: string;
                    id: string;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Revoke {
                type Props = {
                    transaction: ORM.EntityManager;
                    identifiers: string[];
                    realm: string;
                };

                type Result = Promise<Entities.Role[]>;

                type Signature = (props: Props) => Result;
            }

            namespace Purge {
                type Props = {
                    transaction: ORM.EntityManager;
                    realm: string;
                    id: string;
                };

                type Result = Promise<Entities.Role>;

                type Signature = (props: Props) => Result;
            }

            namespace Move {
                type Steps = {
                    removedPaths: Omit<Entities.RoleClosure, "realm" | "depth">[];
                    upsertedPaths: Omit<Entities.RoleClosure, "realm">[];
                }[];

                type Props = {
                    transaction: ORM.EntityManager;
                    targetParent: string;
                    mode: MoveMode;
                    target: string;
                    realm: string;
                };

                type Result = Promise<{
                    target: Entities.Role;
                    steps: Steps;
                }>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
