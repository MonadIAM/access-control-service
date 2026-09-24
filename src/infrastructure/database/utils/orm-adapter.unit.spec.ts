import { describe, expect, it } from "@jest/globals";
import { QueryOrder } from "@mikro-orm/postgresql";

import { PublicOrdinalOperator as OrdinalOperator, PublicStringOperator as StringOperator } from "../enums";
import { ORMAdapter } from "./orm-adapter";

describe("ORMAdapter", () => {
    it.each([
        [1, 0],
        [3, 50],
    ])("converts page %s to offset %s", (currentPage, offset) => {
        expect(ORMAdapter.pagination({ currentPage, elementsPerPage: 25 })).toEqual({ limit: 25, offset });
    });

    it.each([
        [StringOperator.EQUAL, "$eq", "name", "name"],
        [StringOperator.NOT_EQUAL, "$ne", "name", "name"],
        [StringOperator.IN, "$in", ["a", "b"], ["a", "b"]],
        [StringOperator.NOT_IN, "$nin", ["a", "b"], ["a", "b"]],
        [StringOperator.LIKE, "$like", "name", "%name%"],
        [StringOperator.ILIKE, "$ilike", "Name", "%Name%"],
    ] as const)("maps string operator %s", (operator, expectedOperator, value, expectedValue) => {
        const input = Array.isArray(value) ? [...value] : value;
        expect(ORMAdapter.applyStringFilter({ operator, value: input as string | string[] })).toEqual({
            [expectedOperator]: expectedValue,
        });
    });

    it.each([
        [OrdinalOperator.EQUAL, "$eq"],
        [OrdinalOperator.NOT_EQUAL, "$ne"],
        [OrdinalOperator.GREATER_THAN, "$gt"],
        [OrdinalOperator.GREATER_OR_EQUAL, "$gte"],
        [OrdinalOperator.LESS_THAN, "$lt"],
        [OrdinalOperator.LESS_OR_EQUAL, "$lte"],
    ] as const)("maps ordinal operator %s", (operator, expectedOperator) => {
        expect(ORMAdapter.applyOrdinalFilter({ operator, value: 42 })).toEqual({ [expectedOperator]: 42 });
    });

    it.each([
        [OrdinalOperator.IN, "$in"],
        [OrdinalOperator.NOT_IN, "$nin"],
    ] as const)("preserves ordinal arrays for %s", (operator, expectedOperator) => {
        expect(ORMAdapter.applyOrdinalFilter({ operator, value: [1, 2] })).toEqual({ [expectedOperator]: [1, 2] });
    });

    it("converts BETWEEN to inclusive bounds without converting dates", () => {
        const start = new Date("2025-01-01");
        const end = new Date("2025-02-01");
        expect(ORMAdapter.applyOrdinalFilter({ operator: OrdinalOperator.BETWEEN, value: [start, end] })).toEqual({
            $gte: start,
            $lte: end,
        });
        expect(ORMAdapter.applyOrdinalFilter({ operator: OrdinalOperator.BETWEEN, value: 5 })).toEqual({ $gte: 5 });
    });

    it("merges custom order with defaults, ignores absent directions and adds stable ID order", () => {
        const basic = { name: QueryOrder.ASC, createdAt: QueryOrder.DESC };
        const sort = { name: QueryOrder.DESC, createdAt: undefined };
        expect(ORMAdapter.orderBy(sort, basic)).toEqual({
            name: QueryOrder.DESC,
            createdAt: QueryOrder.DESC,
            id: QueryOrder.ASC,
        });
        expect(basic).toEqual({ name: QueryOrder.ASC, createdAt: QueryOrder.DESC });
        expect(sort).toEqual({ name: QueryOrder.DESC, createdAt: undefined });
    });

    it("preserves ID order supplied in either defaults or custom sorting", () => {
        expect(ORMAdapter.orderBy({}, { id: QueryOrder.DESC })).toEqual({ id: QueryOrder.DESC });
        expect(ORMAdapter.orderBy({ id: QueryOrder.DESC }, { name: QueryOrder.ASC })).toEqual({
            name: QueryOrder.ASC,
            id: QueryOrder.DESC,
        });
    });
});
