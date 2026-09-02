import { CountryCode } from "libphonenumber-js/max";
import { Transform, Type } from "class-transformer";
import {
    ValidationOptions,
    ValidateNested,
    IsPhoneNumber,
    ArrayMaxSize,
    ArrayMinSize,
    ArrayUnique,
    IsPositive,
    IsOptional,
    IsDefined,
    MinLength,
    MaxLength,
    IsDecimal,
    IsBoolean,
    IsString,
    IsObject,
    IsNumber,
    Matches,
    IsEmail,
    IsArray,
    Length,
    IsUUID,
    IsDate,
    IsEnum,
    IsInt,
    IsIn,
    Min,
    Max,
} from "class-validator";

import { NotEqualTo } from "./algorithms/not-equal-to.validator";
import { IsMsString } from "./algorithms/is-ms-string.validator";
import { IsOrdinal } from "./algorithms/is-ordinal.validator";

export abstract class StandardValidationDecorators {
    private static readonly dictionaryPath = "validator";

    private static wrap(
        key: Intl.ValidatorKey,
        args: UnknownObject,
        options?: ValidationOptions,
        label?: string,
    ): ValidationOptions {
        return {
            ...options,
            message: `${this.dictionaryPath}.${key}`,
            context: {
                ...options?.context,
                ...args,
                label: label ?? args.property,
            },
        };
    }

    public static IsOptional(options?: ValidationOptions): PropertyDecorator {
        return (target, key) => IsOptional(options)(target, key);
    }

    public static IsRequired(options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) => IsDefined(this.wrap("REQUIRED", { property: key }, options, label))(target, key);
    }

    public static IsObject(options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) => IsObject(this.wrap("IS_OBJECT", { property: key }, options, label))(target, key);
    }

    public static IsString(options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) => IsString(this.wrap("IS_STRING", { property: key }, options, label))(target, key);
    }

    public static Length(min: number, max: number, options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) =>
            Length(min, max, this.wrap("LENGTH", { property: key, min, max }, options, label))(target, key);
    }

    public static MinLength(min: number, options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) =>
            MinLength(min, this.wrap("MIN_LENGTH", { property: key, min }, options, label))(target, key);
    }

    public static MaxLength(max: number, options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) =>
            MaxLength(max, this.wrap("MAX_LENGTH", { property: key, max }, options, label))(target, key);
    }

    public static ArrayMinSize(min: number, options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) =>
            ArrayMinSize(min, this.wrap("ARRAY_MIN_SIZE", { property: key, min }, options, label))(target, key);
    }

    public static ArrayMaxSize(max: number, options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) =>
            ArrayMaxSize(max, this.wrap("ARRAY_MAX_SIZE", { property: key, max }, options, label))(target, key);
    }

    public static IsMatches(pattern: RegExp, options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) => Matches(pattern, this.wrap("MATCHES", { property: key }, options, label))(target, key);
    }

    public static IsEmail(options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) => IsEmail({}, this.wrap("IS_EMAIL", { property: key }, options, label))(target, key);
    }

    public static IsUUID(version?: validator.UUIDVersion, options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) =>
            IsUUID(version ?? "all", this.wrap("IS_UUID", { property: key, version }, options, label))(target, key);
    }

    public static IsPhoneNumber(region?: CountryCode, options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) =>
            IsPhoneNumber(region, this.wrap("IS_PHONE", { property: key, region }, options, label))(target, key);
    }

    public static IsNumber(options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) => {
            Type(() => Number)(target, key);
            return IsNumber({}, this.wrap("IS_NUMBER", { property: key }, options, label))(target, key);
        };
    }

    public static IsInt(options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) => {
            Type(() => Number)(target, key);
            return IsInt(this.wrap("IS_INT", { property: key }, options, label))(target, key);
        };
    }

    public static IsPositive(options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) => {
            Type(() => Number)(target, key);
            return IsPositive(this.wrap("IS_POSITIVE", { property: key }, options, label))(target, key);
        };
    }

    public static Min(min: number, options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) => {
            Type(() => Number)(target, key);
            return Min(min, this.wrap("MIN", { property: key, min }, options, label))(target, key);
        };
    }

    public static Max(max: number, options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) => {
            Type(() => Number)(target, key);
            return Max(max, this.wrap("MAX", { property: key, max }, options, label))(target, key);
        };
    }

    public static IsDecimal(options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) => IsDecimal({}, this.wrap("IS_DECIMAL", { property: key }, options, label))(target, key);
    }

    public static IsBoolean(options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) => {
            Transform(({ value }) => {
                if (typeof value === "string") {
                    return /^true|false$/.test(value) && value === "true";
                } else {
                    return value;
                }
            })(target, key);
            return IsBoolean(this.wrap("IS_BOOLEAN", { property: key }, options, label))(target, key);
        };
    }

    public static IsDate(options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) => {
            Type(() => Date)(target, key);
            return IsDate(this.wrap("IS_DATE", { property: key }, options, label))(target, key);
        };
    }

    public static IsEnum(entity: object, options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) => IsEnum(entity, this.wrap("IS_ENUM", { property: key }, options, label))(target, key);
    }

    public static IsArray(options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) => IsArray(this.wrap("IS_ARRAY", { property: key }, options, label))(target, key);
    }

    public static IsUniqueArray(options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) => ArrayUnique(this.wrap("ARRAY_UNIQUE", { property: key }, options, label))(target, key);
    }

    public static ValidateNested(options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) => ValidateNested(this.wrap("NESTED", { property: key }, options, label))(target, key);
    }

    public static IsIn<T>(list: readonly T[], options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) =>
            IsIn(list, this.wrap("IS_IN", { property: key, list }, options, label))(target, String(key));
    }

    public static IsOrdinal(options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) => IsOrdinal(this.wrap("IS_ORDINAL", { property: key }, options, label))(target, String(key));
    }

    public static NotEqualTo(property: string, options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) =>
            NotEqualTo(property, this.wrap("NOT_EQUAL_TO", { property: key }, options, label))(target, String(key));
    }

    public static IsMsString(options?: ValidationOptions, label?: string): PropertyDecorator {
        return (target, key) =>
            IsMsString(this.wrap("IS_MS_STRING", { property: key }, options, label))(target, String(key));
    }
}
