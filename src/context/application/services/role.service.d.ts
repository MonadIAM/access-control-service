import { EntityManager } from "@mikro-orm/postgresql";

import { MoveMode, RoleActorType, RoleProtoType } from "~context/enums";

declare global {
    namespace Services {
        namespace Role {
            interface Contract {
                purgeSubtree: (props: PurgeSubtree.Props) => Promise<PurgeSubtree.Result>;
                create: (props: Create.Props) => Promise<Create.Result>;
                move: (props: Move.Props) => Promise<Move.Result>;
                purge: (props: Purge) => Promise<void>;
                restore: (props: Restore) => void;
                update: (props: Update) => void;
                revoke: (props: Revoke) => void;
            }

            namespace PurgeSubtree {
                type Props = {
                    transaction: EntityManager;
                    entity: Entities.Role;
                    realm: string;
                };

                type Result = Entities.Role[];
            }

            namespace Create {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        actorType: RoleActorType;
                        protoType: RoleProtoType;
                        parent: Entities.Role;
                        description?: string;
                        children?: string[];
                        code: string;
                        name: string;
                    };
                    realm: Entities.Realm;
                };

                type Result = Entities.Role;
            }

            namespace Move {
                type Props = {
                    targetParent: Entities.Role;
                    transaction: EntityManager;
                    target: Entities.Role;
                    mode: MoveMode;
                    realm: string;
                };

                type Result = {
                    removedPaths: Omit<Entities.RoleClosure, "realm" | "depth">[];
                    upsertedPaths: Omit<Entities.RoleClosure, "realm">[];
                }[];
            }

            type Update = {
                patch: Partial<Entities.Role.MutableFields>;
                entity: Entities.Role;
            };

            type Purge = {
                transaction: EntityManager;
                entity: Entities.Role;
                realm: string;
            };

            type Revoke = {
                entities: Entities.Role[];
            };

            type Restore = {
                entities: Entities.Role[];
            };

            type BuildHierarchy = {
                transaction: EntityManager;
                input: {
                    children?: string[];
                    parent: Entities.Role;
                    entity: Entities.Role;
                    realm: string;
                };
            };
        }
    }
}
