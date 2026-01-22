import { Transform, Type } from "class-transformer";

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
            Transform(({ value }) => {
                if (Array.isArray(value)) {
                    return value;
                } else if (typeof value === "string") {
                    return [value];
                } else {
                    return value;
                }
            }),
            this.IsArray({}, label),
            this.IsString({ each: true }, label),
        );
    }

    public static IsListOrSingleEnum(enumeration: object, label?: string): PropertyDecorator {
        return this.compose(
            Transform(({ value }) => {
                if (Array.isArray(value)) {
                    return value;
                } else if (typeof value === "string") {
                    return [value];
                } else {
                    return value;
                }
            }),
            this.IsArray({}, label),
            this.IsEnum(enumeration, { each: true }, label),
        );
    }

    public static IsListOrSingleUUID(label?: string, version?: validator.UUIDVersion): PropertyDecorator {
        return this.compose(
            Transform(({ value }) => {
                if (Array.isArray(value)) {
                    return value;
                } else if (typeof value === "string") {
                    return [value];
                } else {
                    return value;
                }
            }),
            this.IsArray({}, label),
            this.IsUUID(version ?? "all", { each: true }, label),
        );
    }

    public static IsListOrSinglePositiveInt(label?: string): PropertyDecorator {
        return this.compose(
            Type(() => Number),
            Transform(({ value }) => {
                if (Array.isArray(value)) {
                    return value;
                } else if (typeof value === "number") {
                    return [value];
                } else {
                    return value;
                }
            }),
            this.IsArray({}, label),
            this.IsInt({ each: true }, label),
            this.IsPositive({ each: true }, label),
        );
    }
}
