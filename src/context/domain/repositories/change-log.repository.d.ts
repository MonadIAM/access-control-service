import { EntityManager, FilterQuery, FindOptions, Loaded, QueryOrder } from "@mikro-orm/postgresql";

import { OrdinalFilterDTO, StringFilterDTO } from "~common/dto";
import { ChangeLog as ChangeLogEntity } from "~common/tracking";

declare global {
    namespace Repositories {
        namespace ChangeLog {
            type Entity = ChangeLogEntity;

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
                entity?: StringFilterDTO;
                changeType?: StringFilterDTO;
                entityType?: StringFilterDTO;
                auditEntry?: StringFilterDTO;
                createdAt?: OrdinalFilterDTO<Date>;
            };

            type Sort = {
                createdAt?: QueryOrder;
                at?: QueryOrder;
            };
        }
    }
}
