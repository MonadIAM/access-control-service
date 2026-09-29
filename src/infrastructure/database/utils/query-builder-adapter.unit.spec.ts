import { describe, expect, it } from "@jest/globals";
import { QueryOrder } from "@mikro-orm/postgresql";

import { PublicOrdinalOperator as OrdinalOperator, PublicStringOperator as StringOperator } from "../enums";
import { QueryBuilderAdapter } from "./query-builder-adapter";
import { kysely } from "./kysely-builder";

const baseSQL = 'select "r"."id" from "access_control"."role" as "r"';
const base = kysely.selectFrom("access_control.role as r").select("r.id");

describe("QueryBuilderAdapter", () => {
    describe("pagination", () => {
        it.each([
            [1, 0],
            [3, 50],
        ])("compiles pagination for page %s with bound values", (currentPage, offset) => {
            const compiled = QueryBuilderAdapter.pagination(base, { currentPage, elementsPerPage: 25 }).compile();
            expect(compiled.sql).toBe(`${baseSQL} limit ? offset ?`);
            expect(compiled.parameters).toEqual([25, offset]);
            expect(base.compile().sql).toBe(baseSQL);
        });

        it("leaves an absent pagination unchanged", () => {
            expect(QueryBuilderAdapter.pagination(base, undefined as unknown as Pagination)).toBe(base);
        });
    });

    describe("applyStringFilter", () => {
        it.each([
            [StringOperator.EQUAL, "=", "text"],
            [StringOperator.NOT_EQUAL, "!=", "text"],
            [StringOperator.LIKE, "like", "%text%"],
            [StringOperator.ILIKE, "ilike", "%text%"],
        ] as const)("compiles string operator %s", (operator, sqlOperator, parameter) => {
            const compiled = QueryBuilderAdapter.applyStringFilter(base, { operator, value: "text" }, "r.name").compile();
            expect(compiled.sql).toBe(`${baseSQL} where "r"."name" ${sqlOperator} ?`);
            expect(compiled.parameters).toEqual([parameter]);
        });

        it.each([
            [StringOperator.IN, "in"],
            [StringOperator.NOT_IN, "not in"],
        ] as const)("compiles string array operator %s", (operator, sqlOperator) => {
            const compiled = QueryBuilderAdapter.applyStringFilter(
                base,
                { operator, value: ["a", "b"] },
                "r.name",
            ).compile();
            expect(compiled.sql).toBe(`${baseSQL} where "r"."name" ${sqlOperator} (?, ?)`);
            expect(compiled.parameters).toEqual(["a", "b"]);
        });

        it("keeps user input out of the SQL text", () => {
            const value = "x' OR 1=1 --";
            const compiled = QueryBuilderAdapter.applyStringFilter(
                base,
                { operator: StringOperator.EQUAL, value },
                "r.name",
            ).compile();
            expect(compiled.sql).toBe(`${baseSQL} where "r"."name" = ?`);
            expect(compiled.parameters).toEqual([value]);
        });
    });

    describe("applyOrdinalFilter", () => {
        it.each([
            [OrdinalOperator.EQUAL, "="],
            [OrdinalOperator.NOT_EQUAL, "!="],
            [OrdinalOperator.GREATER_THAN, ">"],
            [OrdinalOperator.GREATER_OR_EQUAL, ">="],
            [OrdinalOperator.LESS_THAN, "<"],
            [OrdinalOperator.LESS_OR_EQUAL, "<="],
        ] as const)("compiles ordinal operator %s", (operator, sqlOperator) => {
            const value = new Date("2025-01-01");
            const compiled = QueryBuilderAdapter.applyOrdinalFilter(base, { operator, value }, "r.created_at").compile();
            expect(compiled.sql).toBe(`${baseSQL} where "r"."created_at" ${sqlOperator} ?`);
            expect(compiled.parameters).toEqual([value]);
        });

        it("compiles BETWEEN as inclusive bounds", () => {
            const compiled = QueryBuilderAdapter.applyOrdinalFilter(
                base,
                { operator: OrdinalOperator.BETWEEN, value: [1, 2] },
                "r.version",
            ).compile();
            expect(compiled.sql).toBe(`${baseSQL} where "r"."version" >= ? and "r"."version" <= ?`);
            expect(compiled.parameters).toEqual([1, 2]);
        });

        it.each(["IN", "NOT_IN"])("does not apply removed ordinal operator %s", (operator) => {
            expect(
                QueryBuilderAdapter.applyOrdinalFilter(
                    base,
                    { operator: operator as OrdinalOperator, value: [1, 2] },
                    "r.version",
                ),
            ).toBe(base);
        });
    });

    describe("applyStringFilter / applyOrdinalFilter", () => {
        it("leaves unsupported operator/value combinations unchanged", () => {
            expect(
                QueryBuilderAdapter.applyStringFilter(base, { operator: StringOperator.EQUAL, value: ["a"] }, "r.name"),
            ).toBe(base);
            expect(QueryBuilderAdapter.applyStringFilter(base, { operator: StringOperator.IN, value: "a" }, "r.name")).toBe(
                base,
            );
            expect(
                QueryBuilderAdapter.applyOrdinalFilter(
                    base,
                    { operator: OrdinalOperator.EQUAL, value: [1, 2] },
                    "r.version",
                ),
            ).toBe(base);
            expect(
                QueryBuilderAdapter.applyOrdinalFilter(base, { operator: "IN" as OrdinalOperator, value: 1 }, "r.version"),
            ).toBe(base);
        });
    });

    describe("orderBy", () => {
        it("applies default sorting with snake_case and stable ID order", () => {
            const compiled = QueryBuilderAdapter.orderBy(base, {}, "r", ["createdAt", QueryOrder.DESC]).compile();
            expect(compiled.sql).toBe(`${baseSQL} order by "r"."created_at" desc, "r"."id" asc`);
        });

        it.each([
            [QueryOrder.ASC, "asc"],
            [QueryOrder.DESC, "desc"],
            [QueryOrder.ASC_NULLS_FIRST, "asc nulls first"],
            [QueryOrder.DESC_NULLS_LAST, "desc nulls last"],
        ] as const)("compiles custom direction %s and preserves qualified column names", (direction, sqlDirection) => {
            const compiled = QueryBuilderAdapter.orderBy(base, { "r.name": direction }, "r", [
                "id",
                QueryOrder.ASC,
            ]).compile();
            expect(compiled.sql).toBe(`${baseSQL} order by "r"."name" ${sqlDirection}, "r"."id" asc`);
        });

        it.each(["id", "r.id"])("does not duplicate ID sorting when %s precedes another key", (key) => {
            const compiled = QueryBuilderAdapter.orderBy(base, { [key]: QueryOrder.DESC, createdAt: QueryOrder.ASC }, "r", [
                "id",
                QueryOrder.ASC,
            ]).compile();
            expect(compiled.sql).toBe(`${baseSQL} order by "r"."id" desc, "r"."created_at" asc`);
        });

        it("ignores missing directions and adds ID sorting", () => {
            const sort = { name: undefined } as unknown as Record<string, QueryOrder>;
            expect(QueryBuilderAdapter.orderBy(base, sort, "r", ["id", QueryOrder.ASC]).compile().sql).toBe(
                `${baseSQL} order by "r"."id" asc`,
            );
        });
    });
});
