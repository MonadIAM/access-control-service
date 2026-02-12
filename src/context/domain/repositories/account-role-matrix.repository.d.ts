import { EntityManager, FilterQuery, FindOptions, Loaded, QueryOrder } from "@mikro-orm/postgresql";

import { LinkFilterDTO, OrdinalFilterDTO, StringFilterDTO } from "~common/dto";

import { AccountRoleMatrix as AccountRoleMatrixEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace AccountRoleMatrix {
            type Entity = AccountRoleMatrixEntity;

            interface Contract {
                findUnique: <P extends string = never, F extends string = "*">(
                    props: FindUnique<P, F>,
                ) => Promise<Nullable<Loaded<Entity, P, F>>>;

                findUniqueOrThrow: <P extends string = never, F extends string = "*">(
                    props: FindUniqueOrThrow<P, F>,
                ) => Promise<Loaded<Entity, P, F>>;

                findMany: <P extends string = never, F extends string = "*">(
                    props: FindMany<P, F>,
                ) => Promise<[Loaded<Entity, P, F>[], number]>;

                wouldExceedRoleLimit: (props: WouldExceedRoleLimit) => Promise<boolean>;
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

            type WouldExceedRoleLimit = {
                transaction?: EntityManager;
                account: string;
                roles: string[];
            };

            type Filters = {
                id?: StringFilterDTO;
                account?: LinkFilterDTO;
                isSystemManaged?: boolean;
                role?: LinkFilterDTO;
                realm?: LinkFilterDTO;
                updatedAt?: OrdinalFilterDTO<Date>;
                createdAt?: OrdinalFilterDTO<Date>;
                isRevoked?: boolean;
            };

            type Sort = {
                createdAt?: QueryOrder;
                updatedAt?: QueryOrder;
            };
        }
    }
}
