import { EntityManager, FilterQuery, FindOptions, Loaded, QueryOrder } from "@mikro-orm/postgresql";

import { LinkFilterDTO, OrdinalFilterDTO, StringFilterDTO } from "~common/dto";
import { AuditJournal as AuditJournalEntity } from "~context/domain/entities";

declare global {
    namespace Repositories {
        namespace AuditJournal {
            type Entity = AuditJournalEntity;

            interface Contract {
                create: (props: Create) => Promise<Entity>;
                bulkCreate: (props: BulkCreate) => Promise<Entity[]>;
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

                find: <P extends string = never, F extends string = "*">(
                    props: Find<P, F>,
                ) => Promise<Loaded<Entity, P, F>[]>;
            }

            type Create = {
                transaction?: EntityManager;
                entity: Entity;
            };

            type BulkCreate = {
                transaction?: EntityManager;
                entities: Entity[];
            };

            type BulkDelete = {
                transaction?: EntityManager;
                where: FilterQuery<Entity>;
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
                  };

            type Find<P extends string, F extends string> = {
                transaction?: EntityManager;
                options?: FindOptions<Entity, P, F>;
                where: FilterQuery<Entity>;
            };

            type Filters = {
                id?: StringFilterDTO;
                entity?: LinkFilterDTO;
                realm?: LinkFilterDTO;
                by?: LinkFilterDTO;
                at?: OrdinalFilterDTO<Date>;
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
