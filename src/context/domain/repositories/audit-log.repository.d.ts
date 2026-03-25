import { EntityManager, FilterQuery, FindOptions, Loaded, QueryOrder } from "@mikro-orm/postgresql";

import { LinkFilterDTO, OrdinalFilterDTO, StringFilterDTO } from "~common/dto";
import { AuditLog as AuditLogEntity } from "~common/tracking";

declare global {
    namespace Repositories {
        namespace AuditLog {
            type Entity = AuditLogEntity;

            interface Contract {
                findUniqueOrThrow: <P extends string = never, F extends string = "*">(
                    props: FindUniqueOrThrow<P, F>,
                ) => Promise<Loaded<Entity, P, F>>;

                findMany: <P extends string = never, F extends string = "*">(
                    props: FindMany<P, F>,
                ) => Promise<[Loaded<Entity, P, F>[], number]>;
            }

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
                  };

            type Filters = {
                id?: StringFilterDTO;
                realm?: LinkFilterDTO;
                actor?: LinkFilterDTO;
                ip?: StringFilterDTO;
                userAgent?: StringFilterDTO;
                actionType?: StringFilterDTO;
                entityType?: StringFilterDTO;
                createdAt?: OrdinalFilterDTO<Date>;
            };

            type Sort = {
                createdAt?: QueryOrder;
                at?: QueryOrder;
            };
        }
    }
}
