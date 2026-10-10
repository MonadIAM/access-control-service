import { describe, expect, it } from "@jest/globals";
import { QueryOrder } from "@mikro-orm/postgresql";

import { PublicOrdinalOperator as OrdinalOperator, PublicStringOperator as StringOperator } from "../enums";
import { ORMAdapter } from "./orm-adapter";

describe("[Utility] - ORMAdapter", () => {
    describe("[Method] - pagination", () => {
        it.each([
            [1, 0],
            [3, 50],
        ])("[case] - converts page %s to offset %s", (currentPage, offset) => {
            // Arrange

            // Act
            const result = ORMAdapter.pagination({ currentPage, elementsPerPage: 25 });

            // Assert
            expect(result).toEqual({ limit: 25, offset });
        });
    });

    describe("[Method] - applyStringFilter", () => {
        it.each([
            [StringOperator.EQUAL, "$eq", "name", "name"],
            [StringOperator.NOT_EQUAL, "$ne", "name", "name"],
            [StringOperator.IN, "$in", ["a", "b"], ["a", "b"]],
            [StringOperator.NOT_IN, "$nin", ["a", "b"], ["a", "b"]],
            [StringOperator.LIKE, "$like", "name", "%name%"],
            [StringOperator.ILIKE, "$ilike", "Name", "%Name%"],
        ] as const)("[case] - maps string operator %s", (operator, expectedOperator, value, expectedValue) => {
            // Arrange
            const input = Array.isArray(value) ? [...value] : value;

            // Act
            const result = ORMAdapter.applyStringFilter({ operator, value: input as string | string[] });

            // Assert
            expect(result).toEqual({
                [expectedOperator]: expectedValue,
            });
        });
    });

    describe("[Method] - applyOrdinalFilter", () => {
        it.each([
            [OrdinalOperator.EQUAL, "$eq"],
            [OrdinalOperator.NOT_EQUAL, "$ne"],
            [OrdinalOperator.GREATER_THAN, "$gt"],
            [OrdinalOperator.GREATER_OR_EQUAL, "$gte"],
            [OrdinalOperator.LESS_THAN, "$lt"],
            [OrdinalOperator.LESS_OR_EQUAL, "$lte"],
        ] as const)("[case] - maps ordinal operator %s", (operator, expectedOperator) => {
            // Arrange

            // Act
            const result = ORMAdapter.applyOrdinalFilter({ operator, value: 42 });

            // Assert
            expect(result).toEqual({ [expectedOperator]: 42 });
        });

        it("[case] - converts BETWEEN to inclusive bounds without converting dates", () => {
            // Arrange
            const start = new Date("2025-01-01");
            const end = new Date("2025-02-01");

            // Act
            const result = ORMAdapter.applyOrdinalFilter({ operator: OrdinalOperator.BETWEEN, value: [start, end] });
            const result2 = ORMAdapter.applyOrdinalFilter({ operator: OrdinalOperator.BETWEEN, value: 5 });

            // Assert
            expect(result).toEqual({
                $gte: start,
                $lte: end,
            });
            expect(result2).toEqual({ $gte: 5 });
        });
    });

    describe("[Method] - orderBy", () => {
        it("[case] - merges custom order with defaults, ignores absent directions and adds stable ID order", () => {
            // Arrange
            const basic = { name: QueryOrder.ASC, createdAt: QueryOrder.DESC };
            const sort = { name: QueryOrder.DESC, createdAt: undefined };

            // Act
            const result = ORMAdapter.orderBy(sort, basic);

            // Assert
            expect(result).toEqual({
                name: QueryOrder.DESC,
                createdAt: QueryOrder.DESC,
                id: QueryOrder.ASC,
            });
            expect(basic).toEqual({ name: QueryOrder.ASC, createdAt: QueryOrder.DESC });
            expect(sort).toEqual({ name: QueryOrder.DESC, createdAt: undefined });
        });

        it("[case] - preserves ID order supplied in either defaults or custom sorting", () => {
            // Arrange

            // Act
            const result = ORMAdapter.orderBy({}, { id: QueryOrder.DESC });
            const result2 = ORMAdapter.orderBy({ id: QueryOrder.DESC }, { name: QueryOrder.ASC });

            // Assert
            expect(result).toEqual({ id: QueryOrder.DESC });
            expect(result2).toEqual({
                name: QueryOrder.ASC,
                id: QueryOrder.DESC,
            });
        });
    });
});
