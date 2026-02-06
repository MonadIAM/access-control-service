import { Transform } from "class-transformer";
import { ValidateIf } from "class-validator";

import { StandardValidationDecorators } from "./default-validator.utility";

export abstract class Validator extends StandardValidationDecorators {
    private static compose(...decorators: PropertyDecorator[]): PropertyDecorator {
        return function applyComposedDecorator(target: object, propertyKey: string | symbol): void {
            for (const decorator of decorators) {
                decorator(target, propertyKey);
            }
        };
    }

    public static IsPositiveInt(label?: string): PropertyDecorator {
        return this.compose(this.IsInt({}, label), this.IsPositive({}, label));
    }

    public static IsListOrSingleString(label?: string): PropertyDecorator {
        return this.compose(
            ValidateIf((_, value) => !Array.isArray(value)),
            this.IsString({}, label),

            ValidateIf((_, value) => Array.isArray(value)),
            this.IsArray({}, label),
            this.IsString({ each: true }, label),
        );
    }

    public static IsListOrSingleEnum(enumeration: object, label?: string): PropertyDecorator {
        return this.compose(
            ValidateIf((_, value) => Array.isArray(value)),
            this.IsArray({}, label),
            this.IsEnum(enumeration, { each: true }, label),

            ValidateIf((_, value) => !Array.isArray(value)),
            this.IsEnum(enumeration, {}, label),
        );
    }

    public static IsListOrSingleUUID(label?: string, version?: validator.UUIDVersion): PropertyDecorator {
        return this.compose(
            ValidateIf((_, value) => Array.isArray(value)),
            this.IsArray({}, label),
            this.IsUUID(version, { each: true }, label),

            ValidateIf((_, value) => !Array.isArray(value)),
            this.IsUUID(version, {}, label),
        );
    }

    public static IsListOrSinglePositiveInt(label?: string): PropertyDecorator {
        return this.compose(
            Transform(({ value }) => {
                if (Array.isArray(value)) {
                    return value.map((v) => Number(v));
                } else {
                    return typeof value === "string" ? Number(value) : value;
                }
            }),

            ValidateIf((_, value) => Array.isArray(value)),
            this.IsArray({}, label),
            this.IsInt({ each: true }, label),
            this.IsPositive({ each: true }, label),

            ValidateIf((_, value) => !Array.isArray(value)),
            this.IsInt({}, label),
            this.IsPositive({}, label),
        );
    }
}
