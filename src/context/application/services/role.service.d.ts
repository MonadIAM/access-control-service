import { EntityManager } from "@mikro-orm/postgresql";

import { Realm as RealmEntity, Role as RoleEntity } from "~context/domain/entities";
import { RoleActorType, RoleProtoType } from "~context/enums";

declare global {
    namespace Services {
        namespace Role {
            interface Contract {
                purgeSubtree: (props: PurgeSubtree) => Promise<number>;
                create: (props: Create) => Promise<void>;
                purge: (props: Purge) => Promise<void>;
                restore: (props: Restore) => void;
                update: (props: Update) => void;
                revoke: (props: Revoke) => void;
            }

            type Create = {
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
                actor: string;
            };

            type Update = {
                input: {
                    patch: Partial<Entities.Role.MutableFields>;
                    entity: RoleEntity;
                    reason: string;
                };
                actor: string;
            };

            type Purge = {
                transaction: EntityManager;
                input: {
                    entity: RoleEntity;
                    reason: string;
                };
                realm: string;
            };

            type PurgeSubtree = {
                transaction: EntityManager;
                input: {
                    entity: RoleEntity;
                    reason: string;
                };
                realm: string;
            };

            type Revoke = {
                input: {
                    entities: RoleEntity[];
                    reason: string;
                };
                actor: string;
            };

            type Restore = {
                input: {
                    entities: RoleEntity[];
                    reason: string;
                };
                actor: string;
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
