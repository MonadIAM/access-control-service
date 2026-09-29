import { describe, expect, it } from "@jest/globals";
import { validateSync } from "class-validator";

import { PublicOrdinalOperator } from "~infrastructure/database/enums";

import { OrdinalFilterDTO } from "./ordinal-filter.dto";

describe("OrdinalFilterDTO", () => {
    it.each(["IN", "NOT_IN"])("rejects removed predicate %s", (operator) => {
        const filter = Object.assign(new OrdinalFilterDTO<number>(), { operator, value: [1, 2] });
        expect(validateSync(filter).some((error) => error.property === "operator")).toBe(true);
    });

    it.each(Object.values(PublicOrdinalOperator))("accepts supported predicate %s", (operator) => {
        const filter = Object.assign(new OrdinalFilterDTO<number>(), {
            operator,
            value: operator === PublicOrdinalOperator.BETWEEN ? [1, 2] : 1,
        });
        expect(validateSync(filter)).toEqual([]);
    });
});
