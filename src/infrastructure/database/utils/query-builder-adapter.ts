import { QueryOrder } from "@mikro-orm/postgresql";
import { OrderByModifiers } from "kysely";

import { LinkFilterDTO, OrdinalFilterDTO, StringFilterDTO } from "~common/dto";

import { PublicOrdinalOperator, PublicStringOperator } from "../enums";
import { kysely } from "./kysely-builder";

const { ref } = kysely.dynamic;

export class QueryBuilderAdapter {
    public static pagination<DB, Table extends keyof DB, Output>(
        query: ORM.QueryBuilder<DB, Table, Output>,
        pagination: Pagination,
    ): ORM.QueryBuilder<DB, Table, Output> {
        if (pagination) {
            return query
                .limit(pagination.elementsPerPage)
                .offset((pagination.currentPage - 1) * pagination.elementsPerPage);
        }
        return query;
    }

    public static applyStringFilter<DB, Table extends keyof DB, Output>(
        query: ORM.QueryBuilder<DB, Table, Output>,
        filter: StringFilterDTO | LinkFilterDTO,
        column: string,
    ): ORM.QueryBuilder<DB, Table, Output> {
        if (Array.isArray(filter.value)) {
            switch (filter.operator) {
                case PublicStringOperator.IN:
                    return query.where(ref(column), "in", filter.value);
                case PublicStringOperator.NOT_IN:
                    return query.where(ref(column), "not in", filter.value);
                default:
                    return query;
            }
        } else {
            switch (filter.operator) {
                case PublicStringOperator.EQUAL:
                    return query.where(ref(column), "=", filter.value);
                case PublicStringOperator.NOT_EQUAL:
                    return query.where(ref(column), "!=", filter.value);
                case PublicStringOperator.LIKE:
                    return query.where(ref(column), "like", `%${filter.value}%`);
                case PublicStringOperator.ILIKE:
                    return query.where(ref(column), "ilike", `%${filter.value}%`);
                default:
                    return query;
            }
        }
    }

    public static applyOrdinalFilter<DB, Table extends keyof DB, Output, Value extends Ordinal>(
        query: ORM.QueryBuilder<DB, Table, Output>,
        filter: OrdinalFilterDTO<Value>,
        column: string,
    ): ORM.QueryBuilder<DB, Table, Output> {
        if (Array.isArray(filter.value)) {
            switch (filter.operator) {
                case PublicOrdinalOperator.IN:
                    return query.where(ref(column), "in", filter.value);
                case PublicOrdinalOperator.NOT_IN:
                    return query.where(ref(column), "not in", filter.value);
                default:
                    return query;
            }
        } else {
            switch (filter.operator) {
                case PublicOrdinalOperator.EQUAL:
                    return query.where(ref(column), "=", filter.value);
                case PublicOrdinalOperator.NOT_EQUAL:
                    return query.where(ref(column), "!=", filter.value);
                case PublicOrdinalOperator.GREATER_THAN:
                    return query.where(ref(column), ">", filter.value);
                case PublicOrdinalOperator.GREATER_OR_EQUAL:
                    return query.where(ref(column), ">=", filter.value);
                case PublicOrdinalOperator.LESS_THAN:
                    return query.where(ref(column), "<", filter.value);
                case PublicOrdinalOperator.LESS_OR_EQUAL:
                    return query.where(ref(column), "<=", filter.value);
                default:
                    return query;
            }
        }
    }

    public static orderBy<DB, Table extends keyof DB, Output, Entity extends ORM.AnyEntity>(
        query: ORM.QueryBuilder<DB, Table, Output>,
        sort: Record<string, QueryOrder>,
        tableAlias: string,
        basicSort: [ORM.EntityKey<Entity>, QueryOrder],
    ): ORM.QueryBuilder<DB, Table, Output> {
        const entries = Object.typedEntries(sort);
        let ordered = query;

        if (entries.length > 0) {
            for (const [key, value] of entries) {
                if (value) {
                    const column = key.includes(".") ? key : `${tableAlias}.${this.toSnakeCase(key)}`;
                    ordered = ordered.orderBy(ref(column), this.direction(value));
                }
            }
        } else {
            const defaultColumn = `${tableAlias}.${this.toSnakeCase(basicSort[0])}`;
            ordered = ordered.orderBy(ref(defaultColumn), this.direction(basicSort[1]));
        }

        const hasIDOrder = entries.some(([key, value]) => Boolean(value) && (key === "id" || key === `${tableAlias}.id`));

        if (!hasIDOrder) {
            ordered = ordered.orderBy(ref(`${tableAlias}.id`), this.direction(QueryOrder.ASC));
        }

        return ordered;
    }

    private static direction(order: QueryOrder): OrderByModifiers {
        const [direction, nulls] = order.toLowerCase().split(" nulls ");

        return (builder) => {
            const directed = direction === "desc" ? builder.desc() : builder.asc();

            switch (nulls) {
                case "first":
                    return directed.nullsFirst();
                case "last":
                    return directed.nullsLast();
                default:
                    return directed;
            }
        };
    }

    private static toSnakeCase(value: string): string {
        return value.replace(/([a-z\d])([A-Z])/g, "$1_$2").toLowerCase();
    }
}
