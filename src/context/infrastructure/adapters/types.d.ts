import { FilterQuery, FindOptions, Knex, ObjectQuery, QueryOrder } from "@mikro-orm/postgresql";

import { LinkFilterDTO, OrdinalFilterDTO, StringFilterDTO } from "~common/dto";

declare global {
    namespace Adapters {
        type Meta = {
            Filters: unknown;
            Sort: unknown;
        };

        interface Contract<E, A extends Meta> {
            buildOptionsORM<P extends string, F extends string>(
                sort: A["Sort"],
                pagination: Pagination,
                options?: FindOptions<E, P, F>,
            ): FindOptions<E, P, F>;

            buildWhereORM(filters: A["Filters"], basic?: ObjectQuery<E>): FilterQuery<E>;

            buildWhereKnex?(query: Knex.QueryBuilder, filters: A["Filters"], tableAlias: string): void;

            buildOptionsKnex?(query: Knex.QueryBuilder, sort: A["Sort"], pagination: Pagination, tableAlias: string): void;
        }

        namespace Invite {
            type Filters = {
                id?: StringFilterDTO;
                status?: StringFilterDTO;
                invitee?: LinkFilterDTO;
                inviter?: LinkFilterDTO;
                role?: LinkFilterDTO;
                realm?: LinkFilterDTO;
                updatedAt?: OrdinalFilterDTO<Date>;
                createdAt?: OrdinalFilterDTO<Date>;
            };

            type Sort = {
                createdAt?: QueryOrder;
                updatedAt?: QueryOrder;
            };

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }

        namespace AccountRoleAssignment {
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

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }

        namespace AuditLog {
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

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }

        namespace ChangeLog {
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

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }

        namespace PermissionOverride {
            type Filters = {
                id?: StringFilterDTO;
                account?: LinkFilterDTO;
                effect?: StringFilterDTO;
                permission?: LinkFilterDTO;
                realm?: LinkFilterDTO;
                updatedAt?: OrdinalFilterDTO<Date>;
                createdAt?: OrdinalFilterDTO<Date>;
                isRevoked?: boolean;
            };

            type Sort = {
                createdAt?: QueryOrder;
                updatedAt?: QueryOrder;
            };

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }

        namespace Permission {
            type Filters = {
                id?: StringFilterDTO;
                isSystemManaged?: boolean;
                code?: StringFilterDTO;
                name?: StringFilterDTO;
                realm?: LinkFilterDTO;
                role?: LinkFilterDTO;
                updatedAt?: OrdinalFilterDTO<Date>;
                createdAt?: OrdinalFilterDTO<Date>;
                isRevoked?: boolean;
            };

            type Sort = {
                createdAt?: QueryOrder;
                updatedAt?: QueryOrder;
            };

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }

        namespace Realm {
            type Filters = {
                id?: StringFilterDTO;
                isSystemManaged?: boolean;
                code?: StringFilterDTO;
                name?: StringFilterDTO;
                updatedAt?: OrdinalFilterDTO<Date>;
                createdAt?: OrdinalFilterDTO<Date>;
                isRevoked?: boolean;
            };

            type Sort = {
                createdAt?: QueryOrder;
                updatedAt?: QueryOrder;
            };

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }

        namespace RoleConflictGroup {
            type Filters = {
                maxAllowed?: OrdinalFilterDTO<number>;
                updatedAt?: OrdinalFilterDTO<Date>;
                createdAt?: OrdinalFilterDTO<Date>;
                code?: StringFilterDTO;
                name?: StringFilterDTO;
                realm?: LinkFilterDTO;
                id?: StringFilterDTO;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
            };

            type Sort = {
                createdAt?: QueryOrder;
                updatedAt?: QueryOrder;
            };

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }

        namespace RoleConflictMember {
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

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }

        namespace RoleDelegationPolicy {
            type Filters = {
                depthLimit?: OrdinalFilterDTO<number>;
                updatedAt?: OrdinalFilterDTO<Date>;
                createdAt?: OrdinalFilterDTO<Date>;
                delegator?: LinkFilterDTO;
                target?: LinkFilterDTO;
                realm?: LinkFilterDTO;
                id?: StringFilterDTO;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
            };

            type Sort = {
                updatedAt?: QueryOrder;
                createdAt?: QueryOrder;
            };

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }

        namespace RolePermissionAssignment {
            type Filters = {
                updatedAt?: OrdinalFilterDTO<Date>;
                createdAt?: OrdinalFilterDTO<Date>;
                permission?: LinkFilterDTO;
                role?: LinkFilterDTO;
                id?: StringFilterDTO;
                isSystemManaged?: boolean;
                isRevoked?: boolean;
            };

            type Sort = {
                updatedAt?: QueryOrder;
                createdAt?: QueryOrder;
            };

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }

        namespace Role {
            type DefaultFilters = {
                updatedAt?: OrdinalFilterDTO<Date>;
                createdAt?: OrdinalFilterDTO<Date>;
                actorType?: StringFilterDTO;
                prototype?: StringFilterDTO;
                code?: StringFilterDTO;
                name?: StringFilterDTO;
                id?: StringFilterDTO;
                permission?: LinkFilterDTO;
                isSystemManaged?: boolean;
                nonDelegable?: boolean;
                isRevoked?: boolean;
            };

            type ManageFilters = DefaultFilters & { realm?: LinkFilterDTO };

            type Filters = DefaultFilters & ManageFilters;

            type Sort = {
                updatedAt?: QueryOrder;
                createdAt?: QueryOrder;
            };

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }
    }
}
