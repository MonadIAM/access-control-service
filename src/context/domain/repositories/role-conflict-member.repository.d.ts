import { EntityManager, FilterQuery, FindOptions, Loaded, QueryOrder } from "@mikro-orm/postgresql";

import { OrdinalFilterDTO, StringFilterDTO, LinkFilterDTO } from "~common/dto";

import { RoleConflictMember as RoleConflictMemberEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace RoleConflictMember {
            type Entity = RoleConflictMemberEntity;

            interface CommonContract {
                findUnique: <P extends string = never, F extends string = "*">(
                    props: FindUnique<P, F>,
                ) => Promise<Nullable<Loaded<Entity, P, F>>>;

                findUniqueOrThrow: <P extends string = never, F extends string = "*">(
                    props: FindUniqueOrThrow<P, F>,
                ) => Promise<Loaded<Entity, P, F>>;
            }

            interface ExternalContract extends CommonContract {
                findMany: <P extends string = never, F extends string = "*">(
                    props: FindMany<P, F>,
                ) => Promise<[Loaded<Entity, P, F>[], number]>;
            }

            interface InternalContract extends CommonContract {
                find: <P extends string = never, F extends string = "*">(
                    props: Find<P, F>,
                ) => Promise<Loaded<Entity, P, F>[]>;

                wouldExceedMemberLimit: (props: WouldExceedMemberLimit) => Promise<boolean>;
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
                      options?: FindOptions<Entity, P, F>;
                      group: string;
                      realm: string;
                  };

            type WouldExceedMemberLimit = {
                transaction?: EntityManager;
                group: string;
                count: number;
            };

            type Filters = {
                id?: StringFilterDTO;
                isSystemManaged?: boolean;
                group?: LinkFilterDTO;
                role?: LinkFilterDTO;
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
