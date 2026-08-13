import { QueryOrder } from "@mikro-orm/postgresql";

import { LinkFilterDTO, OrdinalFilterDTO, StringFilterDTO } from "~common/dto";

declare global {
    namespace Repositories {
        namespace Mappers {
            type Meta = {
                Filters: unknown;
                Sort: unknown;
            };

            interface Contract<E, A extends Meta> {
                buildWhereKnex?(query: ORM.QueryBuilder, filters: A["Filters"], tableAlias: string): void;
                buildWhereORM(filters: A["Filters"], basic?: ORM.ObjectQuery<E>): ORM.FilterQuery<E>;
                buildOptionsORM<P extends string, F extends string>(
                    sort: A["Sort"],
                    pagination: Pagination,
                    options?: ORM.FindOptions<E, P, F>,
                ): ORM.FindOptions<E, P, F>;
                buildOptionsKnex?(
                    query: ORM.QueryBuilder,
                    sort: A["Sort"],
                    pagination: Pagination,
                    tableAlias: string,
                ): void;
            }

            namespace AccountRoleAssignment {
                type DefaultFilters = {
                    id?: StringFilterDTO;
                    account?: LinkFilterDTO;
                    isSystemManaged?: boolean;
                    justification?: StringFilterDTO;
                    role?: LinkFilterDTO;
                    updatedAt?: OrdinalFilterDTO<Date>;
                    createdAt?: OrdinalFilterDTO<Date>;
                    expiresAt?: OrdinalFilterDTO<Date>;
                    isRevoked?: boolean;
                };

                type ManageFilters = DefaultFilters & {
                    realm?: LinkFilterDTO;
                };

                type Filters = DefaultFilters & ManageFilters;

                type Sort = {
                    createdAt?: QueryOrder;
                    updatedAt?: QueryOrder;
                    expiresAt?: QueryOrder;
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
                    justification?: StringFilterDTO;
                    permission?: LinkFilterDTO;
                    realm?: LinkFilterDTO;
                    updatedAt?: OrdinalFilterDTO<Date>;
                    createdAt?: OrdinalFilterDTO<Date>;
                    expiresAt?: OrdinalFilterDTO<Date>;
                    isRevoked?: boolean;
                };

                type Sort = {
                    createdAt?: QueryOrder;
                    updatedAt?: QueryOrder;
                    expiresAt?: QueryOrder;
                };

                interface Types {
                    Filters: Filters;
                    Sort: Sort;
                }
            }

            namespace Permission {
                type DefaultFilters = {
                    id?: StringFilterDTO;
                    isSystemManaged?: boolean;
                    code?: StringFilterDTO;
                    name?: StringFilterDTO;
                    role?: LinkFilterDTO;
                    updatedAt?: OrdinalFilterDTO<Date>;
                    createdAt?: OrdinalFilterDTO<Date>;
                    isRevoked?: boolean;
                };

                type ManageFilters = DefaultFilters & { realm?: LinkFilterDTO };

                type Filters = ManageFilters & DefaultFilters;

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
                    expiresAt?: OrdinalFilterDTO<Date>;
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
                    expiresAt?: QueryOrder;
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
                    archetype?: StringFilterDTO;
                    code?: StringFilterDTO;
                    name?: StringFilterDTO;
                    id?: StringFilterDTO;
                    permission?: LinkFilterDTO;
                    isSystemManaged?: boolean;
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
}
