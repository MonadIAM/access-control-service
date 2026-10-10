import { validateSync, ValidationError } from "class-validator";
import { describe, expect, it } from "@jest/globals";

import { NotEqualTo } from "./not-equal-to.validator";
import { IsMsString } from "./is-ms-string.validator";
import { IsOrdinal } from "./is-ordinal.validator";

function errors(decorator: PropertyDecorator, value: unknown, other?: unknown): ValidationError[] {
    class Input {
        declare public value: unknown;
        declare public other: unknown;
    }
    decorator(Input.prototype, "value");
    return validateSync(Object.assign(new Input(), { value, other }));
}

describe("[Validator] - Algorithms", () => {
    describe("[Function] - IsOrdinal", () => {
        it.each([
            { label: "0", value: 0 },
            { label: "-1", value: -1 },
            { label: "1.5", value: 1.5 },
            { label: "string 2026-01-01", value: "2026-01-01" },
            { label: "Date", value: new Date("2026-01-01") },
            { label: "empty array", value: [] },
            { label: "array [1, string 2026-01-01, Date]", value: [1, "2026-01-01", new Date("2026-01-01")] },
        ])("[case] - accepts comparable scalar or array $label", ({ value }) => {
            // Arrange

            // Act
            const result = errors(IsOrdinal(), value);

            // Assert
            expect(result).toEqual([]);
        });

        it.each([
            { label: "NaN", value: NaN },
            { label: "Infinity", value: Infinity },
            { label: "-Infinity", value: -Infinity },
            { label: "string not-a-date", value: "not-a-date" },
            { label: "invalid Date", value: new Date(NaN) },
            { label: "true", value: true },
            { label: "null", value: null },
            { label: "undefined", value: undefined },
            { label: "empty object", value: {} },
            { label: "array [1, null]", value: [1, null] },
            { label: "array [array [1]]", value: [[1]] },
        ])("[case] - rejects invalid scalar or array $label", ({ value }) => {
            // Arrange

            // Act
            const result = errors(IsOrdinal(), value);

            // Assert
            expect(result[0].constraints).toEqual({
                IsOrdinal: 'Value of field "value" must be a ordinal value.',
            });
        });
    });

    describe("[Function] - NotEqualTo", () => {
        it.each([
            { label: "string a", value: "a", other: "b" },
            { label: "1", value: 1, other: "1" },
            { label: "1", value: 1, other: 2 },
        ])("[case] - accepts $label different from $other", ({ value, other }) => {
            // Arrange

            // Act
            const result = errors(NotEqualTo("other"), value, other);

            // Assert
            expect(result).toEqual([]);
        });

        it.each([
            { label: "string same", value: "same" },
            { label: "1", value: 1 },
            { label: "null", value: null },
            { label: "undefined", value: undefined },
        ])("[case] - rejects equal $label", ({ value }) => {
            // Arrange

            // Act
            const result = errors(NotEqualTo("other"), value, value);

            // Assert
            expect(result[0].constraints).toEqual({
                NotEqualTo: 'Field "value" must not be equal to "other".',
            });
        });
    });

    describe("[Function] - IsMsString", () => {
        it("[case] - provides a default error when used without the localized wrapper", () => {
            // Arrange

            // Act
            const result = errors(IsMsString(), "invalid");

            // Assert
            expect(result[0].constraints).toEqual({
                IsMsString: 'Value of field "value" must be a valid time string (e.g. "1s", "5m", "1h").',
            });
        });

        it("[case] - honors a caller-provided message", () => {
            // Arrange

            // Act
            const result = errors(IsMsString({ message: "Invalid duration" }), "invalid");

            // Assert
            expect(result[0].constraints).toEqual({
                IsMsString: "Invalid duration",
            });
        });
    });
});
