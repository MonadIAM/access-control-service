import { EntityManager } from "@mikro-orm/postgresql";

import { Realm as RealmEntity, Role as RoleEntity } from "~context/domain/entities";
import { MoveMode, RoleActorType, RoleProtoType } from "~context/enums";

declare global {
    namespace Services {
        namespace Role {
            interface Contract {
                purgeSubtree: (props: PurgeSubtree.Props) => Promise<PurgeSubtree.Result>;
                create: (props: Create.Props) => Promise<Create.Result>;
                move: (props: Move) => Promise<void>;
                purge: (props: Purge) => Promise<void>;
                restore: (props: Restore) => void;
                update: (props: Update) => void;
                revoke: (props: Revoke) => void;
            }

            namespace PurgeSubtree {
                type Props = {
                    transaction: EntityManager;
                    entity: RoleEntity;
                    realm: string;
                };

                type Result = number;
            }

            namespace Create {
                type Props = {
                    transaction: EntityManager;
                    input: {
                        actorType: RoleActorType;
                        protoType: RoleProtoType;
                        description?: string;
                        children?: string[];
                        parent: RoleEntity;
                        code: string;
                        name: string;
                    };
                    realm: RealmEntity;
                };

                type Result = RoleEntity;
            }

            type Update = {
                patch: Partial<Entities.Role.MutableFields>;
                entity: RoleEntity;
            };

            type Purge = {
                transaction: EntityManager;
                entity: RoleEntity;
                realm: string;
            };

            type Revoke = {
                entities: RoleEntity[];
            };

            type Restore = {
                entities: RoleEntity[];
            };

            type Move = {
                transaction: EntityManager;
                targetParent: RoleEntity;
                target: RoleEntity;
                mode: MoveMode;
                realm: string;
            };

            type BuildHierarchy = {
                transaction: EntityManager;
                input: {
                    children?: string[];
                    parent: RoleEntity;
                    entity: RoleEntity;
                    realm: string;
                };
            };
        }
    }
}
