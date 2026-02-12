import { EntityManager, FilterQuery, FindOptions, Loaded, QueryOrder } from "@mikro-orm/postgresql";

import { LinkFilterDTO, OrdinalFilterDTO, StringFilterDTO } from "~common/dto";

import { RoleConflictGroup as RoleConflictGroupEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace RoleConflictGroup {
            type Entity = RoleConflictGroupEntity;

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

                findViolationDetails: (props: FindViolationDetails) => Promise<Entity[]>;

                hasViolations: (props: HasViolations) => Promise<boolean>;

                hasAccountViolatingConflictGroup: (props: HasAccountViolatingConflictGroup) => Promise<boolean>;
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

            type FindViolationDetails = {
                account: string;
                roles: string[];
                realm: string;
            };

            type HasViolations = {
                transaction?: EntityManager;
                account: string;
                roles: string[];
                realm: string;
            };

            type GetViolationsQuery = {
                transaction?: EntityManager;
                account: string;
                roles: string[];
                realm: string;
            };

            type HasAccountViolatingConflictGroup = {
                transaction?: EntityManager;
                identifiers: string[];
                maxAllowed: number;
            };

            type Filters = {
                id?: StringFilterDTO;
                isSystemManaged?: boolean;
                maxAllowed?: OrdinalFilterDTO<number>;
                code?: StringFilterDTO;
                name?: StringFilterDTO;
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
