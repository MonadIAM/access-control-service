import { EntityManager, FilterQuery, FindOptions, EntityData, Loaded } from "@mikro-orm/postgresql";

import { RoleConflictGroup as RoleConflictGroupEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace RoleConflictGroup {
            type Entity = RoleConflictGroupEntity;

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

                findAssignmentViolation: (props: FindAssignmentViolation) => Promise<Entity[]>;

                hasAccountViolatingConflictGroup: (props: HasAccountViolatingConflictGroup) => Promise<boolean>;
                wouldRolesViolateSoDPolicy: (props: WouldRolesViolateSoDPolicy) => Promise<boolean>;
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

            type FindAssignmentViolation = {
                transaction?: EntityManager;
                account: string;
                role: string;
            };

            type HasAccountViolatingConflictGroup = {
                transaction?: EntityManager;
                identifiers: string[];
                maxAllowed: number;
            };

            type WouldRolesViolateSoDPolicy = {
                transaction?: EntityManager;
                account: string;
                roles: string[];
            };
        }
    }
}
