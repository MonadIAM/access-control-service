import { validateSync, ValidationError } from "class-validator";
import { describe, expect, it } from "@jest/globals";
import { plainToInstance } from "class-transformer";

import { Validator } from "./validator.utility";

function validate(decorator: PropertyDecorator, value: unknown): { input: { value: unknown }; errors: ValidationError[] } {
    class Input {
        declare public value: unknown;
    }
    decorator(Input.prototype, "value");
    const input = plainToInstance(Input, { value });
    return { input, errors: validateSync(input) };
}

describe("Validator input contracts", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";

    const cases = [
        {
            name: "string or list of strings",
            decorator: Validator.IsListOrSingleString(),
            valid: ["hello", "", ["hello", "world"], []],
            invalid: [123, ["hello", 123], {}, null, undefined, true, [["hello"]]],
        },
        {
            name: "enum or list of enum values",
            decorator: Validator.IsListOrSingleEnum({ ALLOW: "allow", DENY: "deny" }),
            valid: ["allow", ["allow", "deny"], []],
            invalid: ["unknown", ["allow", "unknown"], 123, {}, null, undefined],
        },
        {
            name: "UUID or list of UUIDs",
            decorator: Validator.IsListOrSingleUUID(undefined, "4"),
            valid: [uuid, [uuid], []],
            invalid: ["invalid", [uuid, "invalid"], 123, null, undefined, "550e8400-e29b-11d4-a716-446655440000"],
        },
        {
            name: "positive integer or list of positive integers",
            decorator: Validator.IsListOrSinglePositiveInt(),
            valid: [1, "2", [1, "2"], []],
            invalid: [0, -1, 1.5, "oops", true, null, undefined, {}, [1, -1], [true], [null], [[1]], ["oops"]],
        },
    ];

    describe.each(cases)("$name", ({ decorator, valid, invalid }) => {
        it.each(valid.map((value) => ({ value })))("accepts $value", ({ value }) => {
            expect(validate(decorator, value).errors).toEqual([]);
        });

        it.each(invalid.map((value) => ({ value })))("rejects $value", ({ value }) => {
            expect(validate(decorator, value).errors).not.toHaveLength(0);
        });
    });

    it("accepts supported UUID versions when no version is specified", () => {
        const decorator = Validator.IsListOrSingleUUID();

        expect(validate(decorator, [uuid, "550e8400-e29b-11d4-a716-446655440000"]).errors).toEqual([]);
        expect(validate(decorator, [uuid, "invalid"]).errors).not.toHaveLength(0);
    });

    it("converts numeric strings in scalar and array inputs", () => {
        expect(validate(Validator.IsListOrSinglePositiveInt(), "2").input.value).toBe(2);
        expect(validate(Validator.IsListOrSinglePositiveInt(), [1, "2"]).input.value).toEqual([1, 2]);
    });

    it("preserves the localized validation message and label", () => {
        const { errors } = validate(Validator.IsListOrSingleString("Filter value"), 123);

        expect(errors[0].constraints).toEqual({ isString: "validator.IS_STRING" });
        expect(errors[0].contexts?.isString).toEqual({ property: "value", label: "Filter value" });
    });

    it("honors an optional field without skipping validation of provided values", () => {
        class Input {
            @Validator.IsOptional()
            @Validator.IsListOrSingleString()
            declare public value: unknown;
        }
        expect(validateSync(plainToInstance(Input, {}))).toEqual([]);
        expect(validateSync(plainToInstance(Input, { value: 123 }))).not.toHaveLength(0);
    });

    describe("boolean conversion", () => {
        it.each([
            { value: true, expected: true },
            { value: false, expected: false },
            { value: "true", expected: true },
            { value: "false", expected: false },
        ])("accepts $value as $expected", ({ value, expected }) => {
            const result = validate(Validator.IsBoolean(), value);

            expect(result.input.value).toBe(expected);
            expect(result.errors).toEqual([]);
        });

        it.each(["garbage", "", "TRUE", "falsegarbage", "1", 1, 0, null, undefined, [], {}].map((value) => ({ value })))(
            "rejects $value without converting it to a boolean",
            ({ value }) => {
                const result = validate(Validator.IsBoolean(), value);

                expect(result.input.value).toEqual(value);
                expect(result.errors).not.toHaveLength(0);
            },
        );
    });

    describe("duration strings", () => {
        it.each(["1s", "5m", "1h", "1.5 hours", "0ms", "12"])("accepts %s", (value) => {
            expect(validate(Validator.IsMsString(), value).errors).toEqual([]);
        });

        it.each(["1garbage", "", "-1s", "Infinity", "1".repeat(101), 12, null, undefined].map((value) => ({ value })))(
            "rejects $value",
            ({ value }) => {
                expect(validate(Validator.IsMsString(), value).errors).not.toHaveLength(0);
            },
        );
    });
});
