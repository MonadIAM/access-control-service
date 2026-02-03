import { QueryOrderKeys, EntityManager, FilterQuery, FindOptions, EntityData } from "@mikro-orm/postgresql";

import {
    RoleDelegationPolicy as RoleDelegationPolicyEntity,
    RolePermissionMatrix as RolePermissionMatrixEntity,
    PermissionOverride as PermissionOverrideEntity,
    RoleConflictMember as RoleConflictMemberEntity,
    RoleConflictGroup as RoleConflictGroupEntity,
    AccountRoleMatrix as AccountRoleMatrixEntity,
    AuditJournal as AuditJournalEntity,
    RoleClosure as RoleClosureEntity,
    Permission as PermissionEntity,
    Realm as RealmEntity,
    Role as RoleEntity,
} from "~context/domain/entities";

declare global {
    namespace Repositories {
        namespace Realm {
            type Entity = RealmEntity;

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
                id: string;
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

        namespace Role {
            type Entity = RoleEntity;

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

            type FindEffectiveRoles = {
                transaction?: EntityManager;
                account: string;
                offset: number;
                limit: number;
                realm: string;
            };

            type FindDelegateableRoles<P extends string, F extends string> = {
                transaction?: EntityManager;
                options?: FindOptions<Entity, P, F>;
                where: FilterQuery<Entity>;
            } & ({ roles: string[]; account?: never } | { account: string; roles?: never });

            type GetRoleGraph = {
                transaction?: EntityManager;
                realm: string;
            };
        }

        namespace RoleClosure {
            type FindAncestors<P extends string> = {
                transaction?: EntityManager;
                options?: FindOptions<RoleClosureEntity, P>;
                roleOrderBy?: QueryOrderKeys<RoleEntity>;
                roleWhere?: FilterQuery<RoleEntity>;
                descendant: string;
                depth?: number;
            };

            type FindDescendants<P extends string> = {
                transaction?: EntityManager;
                options?: FindOptions<RoleClosureEntity, P>;
                roleOrderBy?: QueryOrderKeys<RoleEntity>;
                roleWhere?: FilterQuery<RoleEntity>;
                ancestor: string;
                depth?: number;
            };

            type InsertNewHierarchy = {
                transaction?: EntityManager;
                descendant: string;
                ancestor: string;
                realm: string;
            };

            type MoveSubtrees = {
                transaction?: EntityManager;
                oldParent: string;
                newParent: string;
                children: string[];
                realm: string;
            };

            type RebuildTransitivePathsOnCollapse = {
                transaction?: EntityManager;
                deletedRole: string;
                newAncestor: string;
                realm: string;
            };

            type DeleteTransitivePaths = {
                transaction?: EntityManager;
                realm: string;
                role: string;
            };
        }

        namespace RoleConflictGroup {
            type Entity = RoleConflictGroupEntity;

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
        }

        namespace RoleConflictMember {
            type Entity = RoleConflictMemberEntity;

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

        namespace RoleDelegationPolicy {
            type Entity = RoleDelegationPolicyEntity;

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
                realm: string;
            } & ({ identifiers: string[]; delegatorRole?: never } | { delegatorRole: string; identifiers?: never });

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

            type ExistsTransitivePath = {
                transaction?: EntityManager;
                from: string;
                to: string | string[];
            };

            type IsDelegationAllowed = {
                transaction?: EntityManager;
                delegatorRole: string | string[];
                targetRole: string;
            };

            type IsUpwardGrant = {
                transaction?: EntityManager;
                delegatorRole: string[];
                targetRole: string;
            };
        }

        namespace Permission {
            type Entity = PermissionEntity;

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

            type FindEffectivePermissions = {
                transaction?: EntityManager;
                pagination: Pagination;
                account: string;
            };

            type AccountHasPermission = {
                transaction?: EntityManager;
                accountRoles: string[];
                permission: string;
                accountId: string;
            };
        }

        namespace RolePermissionMatrix {
            type Entity = RolePermissionMatrixEntity;

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
                realm: string;
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
            } & ({ identifiers: string[]; role?: never } | { role: string; identifiers?: never });

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

        namespace PermissionOverride {
            type Entity = PermissionOverrideEntity;

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
            } & ({ identifiers: string[]; account?: never } | { account: string; identifiers?: never });

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

        namespace AccountRoleMatrix {
            type Entity = AccountRoleMatrixEntity;

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

            type ExistsActiveAccountWithBothRoles = {
                transaction?: EntityManager;
                identifiers: string[];
                maxAllowed: number;
            };

            type ValidateDelegationForRoles = {
                transaction?: EntityManager;
                roles: string[];
                actor: string;
            };

            type ValidateDelegationForAccount = {
                transaction?: EntityManager;
                accountId: string;
                actor: string;
            };

            type ValidateSoDForNewRoles = {
                transaction?: EntityManager;
                accountId: string;
                roles: string[];
            };

            type ValidateSystemConstraintsForNewRoles = {
                transaction?: EntityManager;
                accountId: string;
                roles: string[];
            };
        }

        namespace AuditJournal {
            type Entity = AuditJournalEntity;

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

            type FindMany<P extends string, F extends string> = {
                transaction?: EntityManager;
                options?: FindOptions<Entity, P, F>;
                where: FilterQuery<Entity>;
            };
        }
    }
}
