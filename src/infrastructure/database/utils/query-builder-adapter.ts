import { QueryOrder } from "@mikro-orm/postgresql";

import { LinkFilterDTO, OrdinalFilterDTO, StringFilterDTO } from "~common/dto";

import { PublicOrdinalOperator, PublicStringOperator } from "../enums";

export class QueryBuilderAdapter {
    public static pagination(query: ORM.QueryBuilder, pagination: Pagination): ORM.QueryBuilder {
        if (pagination) {
            query.limit(pagination.elementsPerPage);
            query.offset((pagination.currentPage - 1) * pagination.elementsPerPage);
        }
        return query;
    }

    public static applyStringFilter(
        query: ORM.QueryBuilder,
        filter: StringFilterDTO | LinkFilterDTO,
        column: string,
    ): void {
        if (Array.isArray(filter.value)) {
            switch (filter.operator) {
                case PublicStringOperator.IN:
                    query.whereIn(column, filter.value);
                    break;
                case PublicStringOperator.NOT_IN:
                    query.whereNotIn(column, filter.value);
                    break;
            }
        } else {
            switch (filter.operator) {
                case PublicStringOperator.EQUAL:
                    query.where(column, filter.value);
                    break;
                case PublicStringOperator.NOT_EQUAL:
                    query.whereNot(column, filter.value);
                    break;
                case PublicStringOperator.LIKE:
                    query.where(column, "like", `%${filter.value}%`);
                    break;
                case PublicStringOperator.ILIKE:
                    query.where(column, "ilike", `%${filter.value}%`);
                    break;
            }
        }
    }

    public static applyOrdinalFilter<T extends Ordinal>(
        query: ORM.QueryBuilder,
        filter: OrdinalFilterDTO<T>,
        column: string,
    ): void {
        if (Array.isArray(filter.value)) {
            switch (filter.operator) {
                case PublicOrdinalOperator.IN:
                    query.whereIn(column, filter.value);
                    break;
                case PublicOrdinalOperator.NOT_IN:
                    query.whereNotIn(column, filter.value);
                    break;
            }
        } else {
            switch (filter.operator) {
                case PublicOrdinalOperator.EQUAL:
                    query.where(column, filter.value);
                    break;
                case PublicOrdinalOperator.NOT_EQUAL:
                    query.whereNot(column, filter.value);
                    break;
                case PublicOrdinalOperator.GREATER_THAN:
                    query.where(column, ">", filter.value);
                    break;
                case PublicOrdinalOperator.GREATER_OR_EQUAL:
                    query.where(column, ">=", filter.value);
                    break;
                case PublicOrdinalOperator.LESS_THAN:
                    query.where(column, "<", filter.value);
                    break;
                case PublicOrdinalOperator.LESS_OR_EQUAL:
                    query.where(column, "<=", filter.value);
                    break;
            }
        }
    }

    public static orderBy<T extends ORM.AnyEntity>(
        query: ORM.QueryBuilder,
        sort: Record<string, QueryOrder>,
        tableAlias: string,
        basicSort: [ORM.EntityKey<T>, QueryOrder],
    ): void {
        const entries = Object.typedEntries(sort);
        if (entries.length > 0) {
            for (const [key, value] of entries) {
                if (value) {
                    const column = key.includes(".") ? key : `${tableAlias}.${this.toSnakeCase(key)}`;
                    query.orderBy(column, value);
                }
            }
        } else {
            const defaultColumn = `${tableAlias}.${this.toSnakeCase(basicSort[0])}`;
            query.orderBy(defaultColumn, basicSort[1]);
        }

        let hasIDOrder = false;

        for (const key in sort) {
            hasIDOrder = sort[key] ? key === "id" || key === `${tableAlias}.id` : false;
        }

        if (!hasIDOrder) {
            query.orderBy(`${tableAlias}.id`, QueryOrder.ASC);
        }
    }

    private static toSnakeCase(value: string): string {
        return value.replace(/([a-z\d])([A-Z])/g, "$1_$2").toLowerCase();
    }
}
