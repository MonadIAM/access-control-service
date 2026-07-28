import { MoveMode, RoleActorType, RoleArchetype } from "~context/enums";

declare global {
    namespace Services {
        namespace Role {
            interface PrivateContract {
                buildHierarchy(props: BuildHierarchy.Props): BuildHierarchy.Result;
            }

            interface Contract extends PrivateContract {
                purgeSubtree(props: PurgeSubtree.Props): PurgeSubtree.Result;
                restore(props: Restore.Props): Restore.Result;
                revoke(props: Revoke.Props): Revoke.Result;
                update(props: Update.Props): Update.Result;
                create(props: Create.Props): Create.Result;
                purge(props: Purge.Props): Purge.Result;
                move(props: Move.Props): Move.Result;
            }

            namespace PurgeSubtree {
                type Props = {
                    transaction: ORM.EntityManager;
                    entity: Entities.Role;
                    realm: string;
                };

                type Result = Promise<Entities.Role[]>;
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
            }

            namespace Update {
                type Props = {
                    patch: Partial<Entities.Role.MutableFields>;
                    entity: Entities.Role;
                };

                type Result = void;
            }

            namespace Purge {
                type Props = {
                    transaction: ORM.EntityManager;
                    entity: Entities.Role;
                    realm: string;
                };

                type Result = Promise<void>;
            }

            namespace Revoke {
                type Props = {
                    entities: Entities.Role[];
                };

                type Result = void;
            }

            namespace Restore {
                type Props = {
                    entities: Entities.Role[];
                };

                type Result = void;
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
            }
        }
    }
}
