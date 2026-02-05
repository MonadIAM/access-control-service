import { EntityManager, FilterQuery, FindOptions, EntityData, Loaded } from "@mikro-orm/postgresql";

import { AccountRoleMatrix as AccountRoleMatrixEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace AccountRoleMatrix {
            type Entity = AccountRoleMatrixEntity;

            interface Contract {
                create: (props: Create) => Promise<Entity>;
                update: (props: Update) => Promise<Entity>;
                delete: (props: Delete) => Promise<void>;
                bulkCreate: (props: BulkCreate) => Promise<Entity[]>;
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

                existsActiveAccountWithConflictRoles: (props: ExistsActiveAccountWithConflictRoles) => Promise<boolean>;
                validateSystemConstraintsForNewRoles: (props: ValidateSystemConstraintsForNewRoles) => Promise<void>;
                validateDelegationForRoles: (props: ValidateDelegationForRoles) => Promise<void>;
                validateSoDForNewRoles: (props: ValidateSoDForNewRoles) => Promise<void>;
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

            type BulkCreate = {
                transaction?: EntityManager;
                entities: Entity[];
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
                realm: string;
            } & ({ identifiers: string[]; accountId?: never } | { accountId: string; identifiers?: never });

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

            type ExistsActiveAccountWithConflictRoles = {
                transaction?: EntityManager;
                identifiers: string[];
                maxAllowed: number;
            };

            type ValidateSystemConstraintsForNewRoles = {
                transaction?: EntityManager;
                accountId: string;
                roles: string[];
            };

            type ValidateDelegationForRoles = {
                transaction?: EntityManager;
                roles: string[];
                actor: string;
            };

            type ValidateSoDForNewRoles = {
                transaction?: EntityManager;
                accountId: string;
                roles: string[];
            };
        }
    }
}
