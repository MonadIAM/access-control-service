import { AnyEntity, EntityKey, FindAllOptions, QueryOrder, QueryOrderMap } from "@mikro-orm/postgresql";
import { OperatorMap } from "@mikro-orm/core/typings";

import { StringFilterDTO, OrdinalFilterDTO, LinkFilterDTO } from "~common/dto";

import { PUBLIC_TO_ORM_OPERATORS } from "./mappers";

export class MikroAdapter {
    public static pagination(pagination: Pagination): Pick<FindAllOptions<AnyEntity>, "limit" | "offset"> {
        return {
            limit: pagination.elementsPerPage,
            offset: (pagination.currentPage - 1) * pagination.elementsPerPage,
        };
    }

    public static applyStringFilter<T extends string>(filter: StringFilterDTO | LinkFilterDTO): OperatorMap<T> {
        return {
            [PUBLIC_TO_ORM_OPERATORS[filter.operator]]: /^LIKE|ILIKE$/.test(filter.operator)
                ? `%${filter.value}%`
                : filter.value,
        };
    }

    public static applyOrdinalFilter<T extends Ordinal>(filter: OrdinalFilterDTO<T>): OperatorMap<T> {
        if (filter.operator === "BETWEEN") {
            if (filter.value instanceof Array && filter.value.length > 1) {
                return { $gte: filter.value[0], $lte: filter.value[1] } as OperatorMap<T>;
            } else {
                return { $gte: filter.value } as OperatorMap<T>;
            }
        } else {
            return { [PUBLIC_TO_ORM_OPERATORS[filter.operator]]: filter.value };
        }
    }

    public static orderBy<T extends AnyEntity>(
        sort: Partial<Record<EntityKey<T>, QueryOrder>>,
        basicSort: QueryOrderMap<T>,
    ): QueryOrderMap<T> {
        const entries = Object.entries(sort) as [EntityKey<T>, QueryOrder][];
        const orderBy: QueryOrderMap<T> = basicSort;
        for (const [key, value] of entries) {
            if (value) {
                orderBy[key] = value;
            }
        }
        return orderBy;
    }
}
