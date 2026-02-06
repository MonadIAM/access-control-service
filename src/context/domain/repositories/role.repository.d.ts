import { EntityManager, FilterQuery, FindOptions, EntityData, Loaded, QueryOrder } from "@mikro-orm/postgresql";

import { LinkFilterDTO, OrdinalFilterDTO, StringFilterDTO } from "~common/dto";
import { DelegatorType } from "~context/enums";

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

                lookupList: (props: LookupList) => Promise<[Entity[], number]>;

                findDelegateableRoles: (props: FindDelegateableRoles) => Promise<[Entity[], number]>;

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

            type FindMany<P extends string, F extends string> =
                | {
                      transaction?: EntityManager;
                      options?: FindOptions<Entity, P, F>;
                      where: FilterQuery<Entity>;
                  }
                | {
                      pagination: Pagination;
                      filters: Filters;
                      sort: Sort;
                      realm: string;
                      options?: FindOptions<Entity, P, F>;
                  };

            type LookupList = {
                pagination: Pagination;
                realm: string;
                term: string;
            };

            type FindDelegateableRoles = {
                where: {
                    type: DelegatorType;
                    realm: string;
                    id: string;
                };
                pagination: Pagination;
                filters: Filters;
                sort: Sort;
            };

            type FindEffectiveRoles = {
                where: {
                    account: string;
                    realm: string;
                };
                pagination: Pagination;
                filters: Filters;
                sort: Sort;
            };

            type GetRoleGraph = {
                transaction?: EntityManager;
                realm: string;
            };

            type Filters = {
                id?: StringFilterDTO;
                code?: StringFilterDTO;
                name?: StringFilterDTO;
                actorType?: StringFilterDTO;
                protoType?: StringFilterDTO;
                createdAt?: OrdinalFilterDTO<Date>;
                nonDelegable?: boolean;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
                permission?: LinkFilterDTO;
            };

            type Sort = {
                createdAt?: QueryOrder;
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
