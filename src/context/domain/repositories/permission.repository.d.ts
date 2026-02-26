import { EntityManager, FilterQuery, FindOptions, Loaded, QueryOrder } from "@mikro-orm/postgresql";

import { LinkFilterDTO, OrdinalFilterDTO, StringFilterDTO } from "~common/dto";
import { AssignmentScope } from "~context/enums";

import { Permission as PermissionEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace Permission {
            type Entity = PermissionEntity;

            interface Contract {
                findUnique: <P extends string = never, F extends string = "*">(
                    props: FindUnique<P, F>,
                ) => Promise<Nullable<Loaded<Entity, P, F>>>;

                findUniqueOrThrow: <P extends string = never, F extends string = "*">(
                    props: FindUniqueOrThrow<P, F>,
                ) => Promise<Loaded<Entity, P, F>>;

                find: <P extends string = never, F extends string = "*">(
                    props: Find<P, F>,
                ) => Promise<Loaded<Entity, P, F>[]>;

                findMany: <P extends string = never, F extends string = "*">(
                    props: FindMany<P, F>,
                ) => Promise<[Loaded<Entity, P, F>[], number]>;

                getLookupList: (props: GetLookupList) => Promise<[Entity[], number]>;

                findEffectivePermissions: (props: FindEffectivePermissions) => Promise<[Entity[], number]>;

                collectEffectivePermissions: (
                    props: CollectEffectivePermissions.Props,
                ) => Promise<CollectEffectivePermissions.Result>;

                findAccountsByPermissions: (props: FindAccountsByPermissions) => Promise<string[]>;
            }

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

            type Find<P extends string, F extends string> = {
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

            namespace CollectEffectivePermissions {
                type Props = {
                    account: string;
                };
                type Result = {
                    scope: AssignmentScope;
                    permission: string;
                    realm: string;
                }[];
            }

            type FindAccountsByPermissions = {
                transaction?: EntityManager;
                permissions: string[];
            };

            type Filters = {
                id?: StringFilterDTO;
                isSystemManaged?: boolean;
                code?: StringFilterDTO;
                name?: StringFilterDTO;
                realm?: LinkFilterDTO;
                role?: LinkFilterDTO;
                updatedAt?: OrdinalFilterDTO<Date>;
                createdAt?: OrdinalFilterDTO<Date>;
                isRevoked?: boolean;
            };

            type Sort = {
                createdAt?: QueryOrder;
            };
        }
    }
}
