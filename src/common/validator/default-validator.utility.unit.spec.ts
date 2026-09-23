import { plainToInstance, Type } from "class-transformer";
import { describe, expect, it } from "@jest/globals";
import { validateSync } from "class-validator";

import { Validator } from "./validator.utility";

const uuid = "550e8400-e29b-41d4-a716-446655440000";
const rules = [
    /* eslint-disable prettier/prettier */
    { name: "required", decorator: Validator.IsRequired(), valid: "x", invalid: undefined, message: "REQUIRED" },
    { name: "object", decorator: Validator.IsObject(), valid: { x: 1 }, invalid: [], message: "IS_OBJECT" },
    { name: "string", decorator: Validator.IsString(), valid: "x", invalid: 1, message: "IS_STRING" },
    { name: "length", decorator: Validator.Length(2, 3), valid: "ab", invalid: "abcd", message: "LENGTH" },
    { name: "min length", decorator: Validator.MinLength(2), valid: "ab", invalid: "a", message: "MIN_LENGTH" },
    { name: "max length", decorator: Validator.MaxLength(2), valid: "ab", invalid: "abc", message: "MAX_LENGTH" },
    { name: "array minimum", decorator: Validator.ArrayMinSize(1), valid: [1], invalid: [], message: "ARRAY_MIN_SIZE" },
    { name: "array maximum", decorator: Validator.ArrayMaxSize(1), valid: [1], invalid: [1, 2], message: "ARRAY_MAX_SIZE" },
    { name: "pattern", decorator: Validator.IsMatches(/^a+$/), valid: "aa", invalid: "ab", message: "MATCHES" },
    { name: "email", decorator: Validator.IsEmail(), valid: "user@example.com", invalid: "user", message: "IS_EMAIL" },
    { name: "UUID", decorator: Validator.IsUUID(), valid: uuid, invalid: "invalid", message: "IS_UUID" },
    { name: "UUID version", decorator: Validator.IsUUID("4"), valid: uuid, invalid: "550e8400-e29b-11d4-a716-446655440000", message: "IS_UUID" },
    { name: "phone", decorator: Validator.IsPhoneNumber("US"), valid: "+12025550123", invalid: "123", message: "IS_PHONE" },
    { name: "number", decorator: Validator.IsNumber(), valid: "1.5", invalid: "oops", expected: 1.5, message: "IS_NUMBER" },
    { name: "integer", decorator: Validator.IsInt(), valid: "2", invalid: "1.5", expected: 2, message: "IS_INT" },
    { name: "positive", decorator: Validator.IsPositive(), valid: "1", invalid: "0", expected: 1, message: "IS_POSITIVE" },
    { name: "minimum", decorator: Validator.Min(2), valid: "2", invalid: "1", expected: 2, message: "MIN" },
    { name: "maximum", decorator: Validator.Max(2), valid: "2", invalid: "3", expected: 2, message: "MAX" },
    { name: "decimal", decorator: Validator.IsDecimal(), valid: "0.5", invalid: "oops", message: "IS_DECIMAL" },
    { name: "boolean", decorator: Validator.IsBoolean(), valid: "false", invalid: "oops", expected: false, message: "IS_BOOLEAN" },
    { name: "date", decorator: Validator.IsDate(), valid: "2026-01-01T00:00:00.000Z", invalid: "oops", expected: new Date("2026-01-01T00:00:00.000Z"), message: "IS_DATE" },
    { name: "enum", decorator: Validator.IsEnum({ A: "a" }), valid: "a", invalid: "b", message: "IS_ENUM" },
    { name: "array", decorator: Validator.IsArray(), valid: [], invalid: {}, message: "IS_ARRAY" },
    { name: "unique array", decorator: Validator.IsUniqueArray(), valid: [1, 2], invalid: [1, 1], message: "ARRAY_UNIQUE" },
    { name: "allowed values", decorator: Validator.IsIn(["a", "b"]), valid: "a", invalid: "c", message: "IS_IN" },
    { name: "ordinal", decorator: Validator.IsOrdinal(), valid: 1, invalid: Infinity, message: "IS_ORDINAL" },
    { name: "different property", decorator: Validator.NotEqualTo("other"), valid: "different", invalid: "same", message: "NOT_EQUAL_TO" },
    { name: "duration", decorator: Validator.IsMsString(), valid: "1s", invalid: "1oops", message: "IS_MS_STRING" },
    /* eslint-enable prettier/prettier */
];

describe("Standard validation contracts", () => {
    it.each(rules)(
        "$name validates, transforms and returns a localized error",
        ({ decorator, valid, invalid, expected, message }) => {
            class Input {
                declare public value: unknown;
                public other = "same";
            }
            decorator(Input.prototype, "value");

            const accepted = plainToInstance(Input, { value: valid });
            const acceptedErrors = validateSync(accepted);
            const errors = validateSync(plainToInstance(Input, { value: invalid }));

            expect(acceptedErrors).toEqual([]);
            expect(accepted.value).toEqual(expected ?? valid);
            expect(errors).toHaveLength(1);
            expect(Object.values(errors[0].constraints!)).toContain(`validator.${message}`);
            expect(Object.values(errors[0].contexts!)).toContainEqual(
                expect.objectContaining({ property: "value", label: "value" }),
            );
        },
    );

    it("preserves options, custom context, bounds and an explicit label", () => {
        class Input {
            @Validator.Length(2, 3, { each: true, groups: ["create"], context: { fieldCode: "names" } }, "Names")
            declare public values: string[];
        }
        const input = plainToInstance(Input, { values: ["ab", "x"] });

        const errors = validateSync(input, { groups: ["create"] });
        const otherGroupErrors = validateSync(input, { groups: ["update"], forbidUnknownValues: false });

        expect(errors).toHaveLength(1);
        expect(Object.values(errors[0].contexts!)).toEqual([
            { fieldCode: "names", property: "values", label: "Names", min: 2, max: 3 },
        ]);
        expect(otherGroupErrors).toEqual([]);
    });

    it("validates nested transformed DTOs and preserves child errors", () => {
        class Child {
            @Validator.IsString()
            declare public name: string;
        }
        class Input {
            @Type(() => Child)
            @Validator.ValidateNested()
            declare public child: Child;
        }

        const validErrors = validateSync(plainToInstance(Input, { child: { name: "valid" } }));
        const errors = validateSync(plainToInstance(Input, { child: { name: 123 } }));
        const primitiveErrors = validateSync(plainToInstance(Input, { child: 123 }));

        expect(validErrors).toEqual([]);
        expect(errors[0].children?.[0]).toMatchObject({
            property: "name",
            constraints: { isString: "validator.IS_STRING" },
        });
        expect(primitiveErrors[0].constraints).toEqual({
            nestedValidation: "validator.NESTED",
        });
    });

    it.each([
        { value: "2", valid: true },
        { value: 0, valid: false },
        { value: -1, valid: false },
        { value: 1.5, valid: false },
    ])("checks the composed positive integer rule for $value", ({ value, valid }) => {
        class Input {
            @Validator.IsPositiveInt()
            declare public count: number;
        }
        const input = plainToInstance(Input, { count: value });

        const errors = validateSync(input);

        expect(errors.length === 0).toBe(valid);
        if (valid) {
            expect(input.count).toBe(2);
        }
    });
});
