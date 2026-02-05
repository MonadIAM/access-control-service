import { EntityManager, FilterQuery, FindOptions, Loaded } from "@mikro-orm/postgresql";

import { RoleConflictMember as RoleConflictMemberEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace RoleConflictMember {
            type Entity = RoleConflictMemberEntity;

            interface Contract {
                create: (props: Create) => Promise<Entity>;
                delete: (props: Delete) => Promise<void>;
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
            }

            type Create = {
                transaction?: EntityManager;
                entity: Entity;
            };

            type Delete = {
                transaction?: EntityManager;
                id: string;
            };

            type BulkCreate = {
                transaction?: EntityManager;
                entities: Entity[];
            };

            type BulkDelete = {
                transaction?: EntityManager;
                identifiers: string[];
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
        }
    }
}
