import { QueryOrder } from "@mikro-orm/postgresql";

import { StringFilterDTO, OrdinalFilterDTO, LinkFilterDTO } from "~common/dto";

import { PUBLIC_TO_ORM_OPERATORS } from "./mappers";

export class ORMAdapter {
    public static pagination(pagination: Pagination): Pick<ORM.FindAllOptions<ORM.AnyEntity>, "limit" | "offset"> {
        return {
            limit: pagination.elementsPerPage,
            offset: (pagination.currentPage - 1) * pagination.elementsPerPage,
        };
    }

    public static applyStringFilter<T extends string>(filter: StringFilterDTO | LinkFilterDTO): ORM.OperatorMap<T> {
        return {
            [PUBLIC_TO_ORM_OPERATORS[filter.operator]]: /^LIKE|ILIKE$/.test(filter.operator)
                ? `%${filter.value}%`
                : filter.value,
        };
    }

    public static applyOrdinalFilter<T extends Ordinal>(filter: OrdinalFilterDTO<T>): ORM.OperatorMap<T> {
        if (filter.operator === "BETWEEN") {
            if (filter.value instanceof Array && filter.value.length > 1) {
                return { $gte: filter.value[0], $lte: filter.value[1] } as ORM.OperatorMap<T>;
            } else {
                return { $gte: filter.value } as ORM.OperatorMap<T>;
            }
        } else {
            return { [PUBLIC_TO_ORM_OPERATORS[filter.operator]]: filter.value };
        }
    }

    public static orderBy<T extends ORM.AnyEntity>(
        sort: Partial<Record<ORM.EntityKey<T>, QueryOrder>>,
        basicSort: ORM.QueryOrderMap<T>,
    ): ORM.QueryOrderMap<T> {
        const entries = Object.entries(sort) as [ORM.EntityKey<T>, QueryOrder][];
        const customOrderBy: Partial<Record<ORM.EntityKey<T>, QueryOrder>> = {};
        for (const [key, value] of entries) {
            if (value) {
                customOrderBy[key] = value;
            }
        }

        const orderBy: ORM.QueryOrderMap<T> & { id?: QueryOrder } = { ...basicSort, ...customOrderBy };

        if (!("id" in orderBy)) {
            orderBy.id = QueryOrder.ASC;
        }

        return orderBy;
    }
}
