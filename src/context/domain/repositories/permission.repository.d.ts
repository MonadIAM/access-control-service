import { EntityManager, FilterQuery, FindOptions, EntityData, Loaded, QueryOrder } from "@mikro-orm/postgresql";

import { LinkFilterDTO, OrdinalFilterDTO, StringFilterDTO } from "~common/dto";

import { Permission as PermissionEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace Permission {
            type Entity = PermissionEntity;

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

                getLookupList: (props: GetLookupList) => Promise<[Entity[], number]>;

                findEffectivePermissions: (props: FindEffectivePermissions) => Promise<[Entity[], number]>;

                accountHasPermission: (props: AccountHasPermission) => Promise<boolean>;
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

            type GetLookupList = {
                pagination: Pagination;
                realm: string;
                term: string;
            };

            type FindEffectivePermissions = {
                where: {
                    account: string;
                    realm: string;
                };
                pagination: Pagination;
                filters: Filters;
                sort: Sort;
            };

            type AccountHasPermission = {
                permission: string;
                account: string;
                realm: string;
                roles: string[];
            };

            type Filters = {
                id?: StringFilterDTO;
                code?: StringFilterDTO;
                name?: StringFilterDTO;
                role?: LinkFilterDTO;
                createdAt?: OrdinalFilterDTO<Date>;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
            };

            type Sort = {
                createdAt?: QueryOrder;
            };
        }
    }
}
