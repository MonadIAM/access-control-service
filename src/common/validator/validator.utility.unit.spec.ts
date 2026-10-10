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

describe("[Validator] - Input", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";

    const cases = [
        {
            name: "IsListOrSingleString",
            decorator: Validator.IsListOrSingleString(),
            valid: [
                { label: "string hello", value: "hello" },
                { label: "empty string", value: "" },
                { label: "array [string hello, string world]", value: ["hello", "world"] },
                { label: "empty array", value: [] },
            ],
            invalid: [
                { label: "123", value: 123 },
                { label: "array [string hello, 123]", value: ["hello", 123] },
                { label: "empty object", value: {} },
                { label: "null", value: null },
                { label: "undefined", value: undefined },
                { label: "true", value: true },
                { label: "array [array [string hello]]", value: [["hello"]] },
            ],
        },
        {
            name: "IsListOrSingleEnum",
            decorator: Validator.IsListOrSingleEnum({ ALLOW: "allow", DENY: "deny" }),
            valid: [
                { label: "string allow", value: "allow" },
                { label: "array [string allow, string deny]", value: ["allow", "deny"] },
                { label: "empty array", value: [] },
            ],
            invalid: [
                { label: "string unknown", value: "unknown" },
                { label: "array [string allow, string unknown]", value: ["allow", "unknown"] },
                { label: "123", value: 123 },
                { label: "empty object", value: {} },
                { label: "null", value: null },
                { label: "undefined", value: undefined },
            ],
        },
        {
            name: "IsListOrSingleUUID",
            decorator: Validator.IsListOrSingleUUID(undefined, "4"),
            valid: [
                { label: "UUID v4", value: uuid },
                { label: "array [UUID v4]", value: [uuid] },
                { label: "empty array", value: [] },
            ],
            invalid: [
                { label: "string invalid", value: "invalid" },
                { label: "array [UUID v4, string invalid]", value: [uuid, "invalid"] },
                { label: "123", value: 123 },
                { label: "null", value: null },
                { label: "undefined", value: undefined },
                { label: "UUID v1", value: "550e8400-e29b-11d4-a716-446655440000" },
            ],
        },
        {
            name: "IsListOrSinglePositiveInt",
            decorator: Validator.IsListOrSinglePositiveInt(),
            valid: [
                { label: "1", value: 1 },
                { label: "string 2", value: "2" },
                { label: "array [1, string 2]", value: [1, "2"] },
                { label: "empty array", value: [] },
            ],
            invalid: [
                { label: "0", value: 0 },
                { label: "-1", value: -1 },
                { label: "1.5", value: 1.5 },
                { label: "string oops", value: "oops" },
                { label: "true", value: true },
                { label: "null", value: null },
                { label: "undefined", value: undefined },
                { label: "empty object", value: {} },
                { label: "array [1, -1]", value: [1, -1] },
                { label: "array [true]", value: [true] },
                { label: "array [null]", value: [null] },
                { label: "array [array [1]]", value: [[1]] },
                { label: "array [string oops]", value: ["oops"] },
            ],
        },
    ];

    describe.each(cases)("[Function] - $name", ({ decorator, valid, invalid }) => {
        it.each(valid)("[case] - accepts $label", ({ value }) => {
            // Arrange

            // Act

            const result = validate(decorator, value).errors;

            // Assert
            expect(result).toEqual([]);
        });

        it.each(invalid)("[case] - rejects $label", ({ value }) => {
            // Arrange

            // Act

            const result = validate(decorator, value).errors;

            // Assert
            expect(result).not.toHaveLength(0);
        });
    });

    describe("[Function] - IsListOrSingleUUID", () => {
        it("[case] - accepts supported UUID versions when no version is specified", () => {
            // Arrange

            // Act
            const decorator = Validator.IsListOrSingleUUID();

            const result = validate(decorator, [uuid, "550e8400-e29b-11d4-a716-446655440000"]).errors;
            const result1 = validate(decorator, [uuid, "invalid"]).errors;

            // Assert
            expect(result).toEqual([]);
            expect(result1).not.toHaveLength(0);
        });
    });

    describe("[Function] - IsListOrSinglePositiveInt", () => {
        it("[case] - converts numeric strings in scalar and array inputs", () => {
            // Arrange

            // Act

            const result = validate(Validator.IsListOrSinglePositiveInt(), "2").input.value;
            const result1 = validate(Validator.IsListOrSinglePositiveInt(), [1, "2"]).input.value;

            // Assert
            expect(result).toBe(2);
            expect(result1).toEqual([1, 2]);
        });
    });

    describe("[Function] - IsListOrSingleString", () => {
        it("[case] - preserves the localized validation message and label", () => {
            // Arrange

            // Act
            const { errors } = validate(Validator.IsListOrSingleString("Filter value"), 123);

            // Assert
            expect(errors[0].constraints).toEqual({ isString: "validator.IS_STRING" });
            expect(errors[0].contexts?.isString).toEqual({ property: "value", label: "Filter value" });
        });

        it("[case] - honors an optional field without skipping validation of provided values", () => {
            // Arrange
            class Input {
                @Validator.IsOptional()
                @Validator.IsListOrSingleString()
                declare public value: unknown;
            }

            // Act
            const result = validateSync(plainToInstance(Input, {}));
            const result2 = validateSync(plainToInstance(Input, { value: 123 }));

            // Assert
            expect(result).toEqual([]);
            expect(result2).not.toHaveLength(0);
        });
    });

    describe("[Behavior] - boolean conversion", () => {
        it.each([
            { label: "true", value: true, expected: true },
            { label: "false", value: false, expected: false },
            { label: "string true", value: "true", expected: true },
            { label: "string false", value: "false", expected: false },
        ])("[case] - accepts $label as $expected", ({ value, expected }) => {
            // Arrange

            // Act
            const result = validate(Validator.IsBoolean(), value);

            // Assert
            expect(result.input.value).toBe(expected);
            expect(result.errors).toEqual([]);
        });

        it.each([
            { label: "string garbage", value: "garbage" },
            { label: "empty string", value: "" },
            { label: "string TRUE", value: "TRUE" },
            { label: "string falsegarbage", value: "falsegarbage" },
            { label: "string 1", value: "1" },
            { label: "1", value: 1 },
            { label: "0", value: 0 },
            { label: "null", value: null },
            { label: "undefined", value: undefined },
            { label: "empty array", value: [] },
            { label: "empty object", value: {} },
        ])("[case] - rejects $label without converting it to a boolean", ({ value }) => {
            // Arrange

            // Act
            const result = validate(Validator.IsBoolean(), value);

            // Assert
            expect(result.input.value).toEqual(value);
            expect(result.errors).not.toHaveLength(0);
        });
    });

    describe("[Behavior] - duration strings", () => {
        it.each(["1s", "5m", "1h", "1.5 hours", "0ms", "12"])("[case] - accepts %s", (value) => {
            // Arrange

            // Act

            const result = validate(Validator.IsMsString(), value).errors;

            // Assert
            expect(result).toEqual([]);
        });

        it.each([
            { label: "string 1garbage", value: "1garbage" },
            { label: "empty string", value: "" },
            { label: "string -1s", value: "-1s" },
            { label: "string Infinity", value: "Infinity" },
            { label: "overlong string", value: "1".repeat(101) },
            { label: "12", value: 12 },
            { label: "null", value: null },
            { label: "undefined", value: undefined },
        ])("[case] - rejects $label", ({ value }) => {
            // Arrange

            // Act

            const result = validate(Validator.IsMsString(), value).errors;

            // Assert
            expect(result).not.toHaveLength(0);
        });
    });
});
