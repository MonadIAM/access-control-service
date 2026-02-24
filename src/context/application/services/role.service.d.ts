import { EntityManager } from "@mikro-orm/postgresql";

import { Role as RoleEntity } from "~context/domain/entities";

declare global {
    namespace Services {
        namespace Role {
            interface Contract {
                create: (props: Create) => Promise<RoleEntity>;
                update: (props: Update) => Promise<void>;
                purge: (props: Purge) => Promise<void>;
                purgeSubtree: (props: PurgeSubtree) => Promise<number>;
                revoke: (props: Revoke) => Promise<void>;
                restore: (props: Restore) => Promise<void>;
            }

            type Create = {
                transaction: EntityManager;
                context: RequestContext;
                input: Entities.Role.ConstructorProps & {
                    children?: string[];
                    parent: RoleEntity;
                };
            };

            type Update = {
                transaction: EntityManager;
                input: {
                    patch: Partial<Entities.Role.MutableFields>;
                    reason: string;
                };
                context: RequestContext;
                entity: RoleEntity;
                realm: string;
                actor: string;
            };

            type Purge = {
                transaction: EntityManager;
                context: RequestContext;
                entity: RoleEntity;
                reason: string;
                realm: string;
                actor: string;
            };

            type PurgeSubtree = {
                transaction: EntityManager;
                context: RequestContext;
                entity: RoleEntity;
                reason: string;
                realm: string;
                actor: string;
            };

            type Revoke = {
                transaction: EntityManager;
                context: RequestContext;
                entities: RoleEntity[];
                reason: string;
                realm: string;
                actor: string;
            };

            type Restore = {
                transaction: EntityManager;
                context: RequestContext;
                entities: RoleEntity[];
                reason: string;
                realm: string;
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
