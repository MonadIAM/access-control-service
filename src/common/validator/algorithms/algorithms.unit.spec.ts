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

describe("IsOrdinal", () => {
    it.each(
        [0, -1, 1.5, "2026-01-01", new Date("2026-01-01"), [], [1, "2026-01-01", new Date("2026-01-01")]].map((value) => ({
            value,
        })),
    )("accepts comparable scalar or array $value", ({ value }) => {
        const result = errors(IsOrdinal(), value);

        expect(result).toEqual([]);
    });

    it.each(
        [NaN, Infinity, -Infinity, "not-a-date", new Date(NaN), true, null, undefined, {}, [1, null], [[1]]].map(
            (value) => ({ value }),
        ),
    )("rejects invalid scalar or array $value", ({ value }) => {
        const result = errors(IsOrdinal(), value);

        expect(result[0].constraints).toEqual({
            IsOrdinal: 'Value of field "value" must be a ordinal value.',
        });
    });
});

describe("NotEqualTo", () => {
    it.each([
        { value: "a", other: "b" },
        { value: 1, other: "1" },
        { value: 1, other: 2 },
    ])("accepts $value different from $other", ({ value, other }) => {
        const result = errors(NotEqualTo("other"), value, other);

        expect(result).toEqual([]);
    });

    it.each(["same", 1, null, undefined].map((value) => ({ value })))("rejects equal $value", ({ value }) => {
        const result = errors(NotEqualTo("other"), value, value);

        expect(result[0].constraints).toEqual({
            NotEqualTo: 'Field "value" must not be equal to "other".',
        });
    });
});

describe("IsMsString messages", () => {
    it("provides a default error when used without the localized wrapper", () => {
        const result = errors(IsMsString(), "invalid");

        expect(result[0].constraints).toEqual({
            IsMsString: 'Value of field "value" must be a valid time string (e.g. "1s", "5m", "1h").',
        });
    });

    it("honors a caller-provided message", () => {
        const result = errors(IsMsString({ message: "Invalid duration" }), "invalid");

        expect(result[0].constraints).toEqual({
            IsMsString: "Invalid duration",
        });
    });
});
