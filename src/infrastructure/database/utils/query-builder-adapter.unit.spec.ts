import { describe, expect, it } from "@jest/globals";
import { QueryOrder } from "@mikro-orm/postgresql";

import { PublicOrdinalOperator as OrdinalOperator, PublicStringOperator as StringOperator } from "../enums";
import { QueryBuilderAdapter } from "./query-builder-adapter";
import { kysely } from "./kysely-builder";

const baseSQL = 'select "r"."id" from "access_control"."role" as "r"';
const base = kysely.selectFrom("access_control.role as r").select("r.id");

describe("[Utility] - QueryBuilderAdapter", () => {
    describe("[Method] - pagination", () => {
        it.each([
            [1, 0],
            [3, 50],
        ])("[case] - compiles pagination for page %s with bound values", (currentPage, offset) => {
            // Arrange

            // Act
            const compiled = QueryBuilderAdapter.pagination(base, { currentPage, elementsPerPage: 25 }).compile();

            // Assert
            expect(compiled.sql).toBe(`${baseSQL} limit ? offset ?`);
            expect(compiled.parameters).toEqual([25, offset]);
            expect(base.compile().sql).toBe(baseSQL);
        });

        it("[case] - leaves an absent pagination unchanged", () => {
            // Arrange

            // Act
            const result = QueryBuilderAdapter.pagination(base, undefined as unknown as Pagination);

            // Assert
            expect(result).toBe(base);
        });
    });

    describe("[Method] - applyStringFilter", () => {
        it.each([
            [StringOperator.EQUAL, "=", "text"],
            [StringOperator.NOT_EQUAL, "!=", "text"],
            [StringOperator.LIKE, "like", "%text%"],
            [StringOperator.ILIKE, "ilike", "%text%"],
        ] as const)("[case] - compiles string operator %s", (operator, sqlOperator, parameter) => {
            // Arrange

            // Act
            const compiled = QueryBuilderAdapter.applyStringFilter(base, { operator, value: "text" }, "r.name").compile();

            // Assert
            expect(compiled.sql).toBe(`${baseSQL} where "r"."name" ${sqlOperator} ?`);
            expect(compiled.parameters).toEqual([parameter]);
        });

        it.each([
            [StringOperator.IN, "in"],
            [StringOperator.NOT_IN, "not in"],
        ] as const)("[case] - compiles string array operator %s", (operator, sqlOperator) => {
            // Arrange

            // Act
            const compiled = QueryBuilderAdapter.applyStringFilter(
                base,
                { operator, value: ["a", "b"] },
                "r.name",
            ).compile();

            // Assert
            expect(compiled.sql).toBe(`${baseSQL} where "r"."name" ${sqlOperator} (?, ?)`);
            expect(compiled.parameters).toEqual(["a", "b"]);
        });

        it("[case] - keeps user input out of the SQL text", () => {
            // Arrange
            const value = "x' OR 1=1 --";

            // Act
            const compiled = QueryBuilderAdapter.applyStringFilter(
                base,
                { operator: StringOperator.EQUAL, value },
                "r.name",
            ).compile();

            // Assert
            expect(compiled.sql).toBe(`${baseSQL} where "r"."name" = ?`);
            expect(compiled.parameters).toEqual([value]);
        });
    });

    describe("[Method] - applyOrdinalFilter", () => {
        it.each([
            [OrdinalOperator.EQUAL, "="],
            [OrdinalOperator.NOT_EQUAL, "!="],
            [OrdinalOperator.GREATER_THAN, ">"],
            [OrdinalOperator.GREATER_OR_EQUAL, ">="],
            [OrdinalOperator.LESS_THAN, "<"],
            [OrdinalOperator.LESS_OR_EQUAL, "<="],
        ] as const)("[case] - compiles ordinal operator %s", (operator, sqlOperator) => {
            // Arrange
            const value = new Date("2025-01-01");

            // Act
            const compiled = QueryBuilderAdapter.applyOrdinalFilter(base, { operator, value }, "r.created_at").compile();

            // Assert
            expect(compiled.sql).toBe(`${baseSQL} where "r"."created_at" ${sqlOperator} ?`);
            expect(compiled.parameters).toEqual([value]);
        });

        it("[case] - compiles BETWEEN as inclusive bounds", () => {
            // Arrange

            // Act
            const compiled = QueryBuilderAdapter.applyOrdinalFilter(
                base,
                { operator: OrdinalOperator.BETWEEN, value: [1, 2] },
                "r.version",
            ).compile();

            // Assert
            expect(compiled.sql).toBe(`${baseSQL} where "r"."version" >= ? and "r"."version" <= ?`);
            expect(compiled.parameters).toEqual([1, 2]);
        });

        it.each(["IN", "NOT_IN"])("[case] - does not apply removed ordinal operator %s", (operator) => {
            // Arrange

            // Act
            const result = QueryBuilderAdapter.applyOrdinalFilter(
                base,
                { operator: operator as OrdinalOperator, value: [1, 2] },
                "r.version",
            );

            // Assert
            expect(result).toBe(base);
        });
    });

    describe("[Behavior] - filter composition", () => {
        it("[case] - leaves unsupported operator/value combinations unchanged", () => {
            // Arrange

            // Act
            const result = QueryBuilderAdapter.applyStringFilter(
                base,
                { operator: StringOperator.EQUAL, value: ["a"] },
                "r.name",
            );
            const result2 = QueryBuilderAdapter.applyStringFilter(
                base,
                { operator: StringOperator.IN, value: "a" },
                "r.name",
            );
            const result3 = QueryBuilderAdapter.applyOrdinalFilter(
                base,
                { operator: OrdinalOperator.EQUAL, value: [1, 2] },
                "r.version",
            );
            const result4 = QueryBuilderAdapter.applyOrdinalFilter(
                base,
                { operator: "IN" as OrdinalOperator, value: 1 },
                "r.version",
            );

            // Assert
            expect(result).toBe(base);
            expect(result2).toBe(base);
            expect(result3).toBe(base);
            expect(result4).toBe(base);
        });
    });

    describe("[Method] - orderBy", () => {
        it("[case] - applies default sorting with snake_case and stable ID order", () => {
            // Arrange

            // Act
            const compiled = QueryBuilderAdapter.orderBy(base, {}, "r", ["createdAt", QueryOrder.DESC]).compile();

            // Assert
            expect(compiled.sql).toBe(`${baseSQL} order by "r"."created_at" desc, "r"."id" asc`);
        });

        it.each([
            [QueryOrder.ASC, "asc"],
            [QueryOrder.DESC, "desc"],
            [QueryOrder.ASC_NULLS_FIRST, "asc nulls first"],
            [QueryOrder.DESC_NULLS_LAST, "desc nulls last"],
        ] as const)(
            "[case] - compiles custom direction %s and preserves qualified column names",
            (direction, sqlDirection) => {
                // Arrange

                // Act
                const compiled = QueryBuilderAdapter.orderBy(base, { "r.name": direction }, "r", [
                    "id",
                    QueryOrder.ASC,
                ]).compile();

                // Assert
                expect(compiled.sql).toBe(`${baseSQL} order by "r"."name" ${sqlDirection}, "r"."id" asc`);
            },
        );

        it.each(["id", "r.id"])("[case] - does not duplicate ID sorting when %s precedes another key", (key) => {
            // Arrange

            // Act
            const compiled = QueryBuilderAdapter.orderBy(base, { [key]: QueryOrder.DESC, createdAt: QueryOrder.ASC }, "r", [
                "id",
                QueryOrder.ASC,
            ]).compile();

            // Assert
            expect(compiled.sql).toBe(`${baseSQL} order by "r"."id" desc, "r"."created_at" asc`);
        });

        it("[case] - ignores missing directions and adds ID sorting", () => {
            // Arrange

            // Act
            const sort = { name: undefined } as unknown as Record<string, QueryOrder>;

            const result = QueryBuilderAdapter.orderBy(base, sort, "r", ["id", QueryOrder.ASC]).compile().sql;

            // Assert
            expect(result).toBe(`${baseSQL} order by "r"."id" asc`);
        });
    });
});
