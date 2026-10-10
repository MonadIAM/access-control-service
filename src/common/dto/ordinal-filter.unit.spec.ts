import { describe, expect, it } from "@jest/globals";
import { validateSync } from "class-validator";

import { PublicOrdinalOperator } from "~infrastructure/database/enums";

import { OrdinalFilterDTO } from "./ordinal-filter.dto";

describe("[DTO] - OrdinalFilter", () => {
    describe("[Behavior] - validation", () => {
        it.each(["IN", "NOT_IN"])("[case] - rejects removed predicate %s", (operator) => {
            // Arrange
            const filter = Object.assign(new OrdinalFilterDTO<number>(), { operator, value: [1, 2] });

            // Act
            const result = validateSync(filter).some((error) => error.property === "operator");

            // Assert
            expect(result).toBe(true);
        });

        it.each(Object.values(PublicOrdinalOperator))("[case] - accepts supported predicate %s", (operator) => {
            // Arrange
            const filter = Object.assign(new OrdinalFilterDTO<number>(), {
                operator,
                value: operator === PublicOrdinalOperator.BETWEEN ? [1, 2] : 1,
            });

            // Act
            const result = validateSync(filter);

            // Assert
            expect(result).toEqual([]);
        });
    });
});
