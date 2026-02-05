import { EntityManager, FilterQuery, FindOptions, EntityData, Loaded } from "@mikro-orm/postgresql";

import { Role as RoleEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace Role {
            type Entity = RoleEntity;

            interface Contract {
                create: (props: Create) => Promise<Entity>;
                update: (props: Update) => Promise<Entity>;
                delete: (props: Delete) => Promise<void>;
                bulkUpdate: (props: BulkUpdate) => Promise<Entity[]>;
                bulkDelete: (props: BulkDelete) => Promise<number>;

                findUnique: <P extends string = never, F extends string = "*">(
                    props: FindUnique<P, F>,
                ) => Promise<Nullable<Loaded<Entity, P, F>>>;

                findUniqueOrThrow: <P extends string = never, F extends string = "*">(
                    props: FindUniqueOrThrow<P, F>,
                ) => Promise<Loaded<Entity, P, F>>;

                findMany: <P extends string = never, F extends string = "*">(
                    props: FindMany<P, F>,
                ) => Promise<[Loaded<Entity, P, F>[], number]>;

                findDelegateableRoles: <P extends string = never, F extends string = "*">(
                    props: FindDelegateableRoles<P, F>,
                ) => Promise<[Loaded<Entity, P, F>[], number]>;

                findEffectiveRoles: (props: FindEffectiveRoles) => Promise<[Entity[], number]>;

                getRoleGraph: (props: GetRoleGraph) => Promise<Graph.Data>;
            }

            type Create = {
                transaction?: EntityManager;
                entity: Entity;
            };

            type Update = {
                transaction?: EntityManager;
                patch: Partial<EntityData<Entity>>;
                entity: Entity;
            };

            type Delete = {
                transaction?: EntityManager;
                realm: string;
                id: string;
            };

            type BulkUpdate = {
                transaction?: EntityManager;
                updates: {
                    patch: Partial<EntityData<Entity>>;
                    entity: Entity;
                }[];
            };

            type BulkDelete = {
                transaction?: EntityManager;
                identifiers: string[];
                realm: string;
            };

            type FindUnique<P extends string, F extends string> = {
                transaction?: EntityManager;
                options?: FindOptions<Entity, P, F>;
                where: FilterQuery<Entity>;
            };

            type FindUniqueOrThrow<P extends string, F extends string> = {
                transaction?: EntityManager;
                options?: FindOptions<Entity, P, F>;
                where: FilterQuery<Entity>;
            };

            type FindMany<P extends string, F extends string> = {
                transaction?: EntityManager;
                options?: FindOptions<Entity, P, F>;
                where: FilterQuery<Entity>;
            };

            type FindDelegateableRoles<P extends string, F extends string> = {
                transaction?: EntityManager;
                options?: FindOptions<Entity, P, F>;
                where: FilterQuery<Entity>;
            } & ({ roles: string[]; account?: never } | { account: string; roles?: never });

            type FindEffectiveRoles = {
                transaction?: EntityManager;
                pagination?: Pagination;
                account: string;
                realm: string;
            };

            type GetRoleGraph = {
                transaction?: EntityManager;
                realm: string;
            };

            namespace Graph {
                type Node = {
                    id: string;
                    label: string;
                    attributes: {
                        code: string;
                        protoType: string;
                        isRevoked: boolean;
                        level: number;
                    };
                };

                type Edge = {
                    id: string;
                    source: string;
                    target: string;
                    type: "arrow";
                };

                type Data = {
                    nodes: Node[];
                    edges: Edge[];
                };
            }
        }
    }
}
