import {
    ValidatorConstraintInterface,
    ValidatorConstraint,
    ValidationArguments,
    ValidationOptions,
    registerDecorator,
} from "class-validator";

@ValidatorConstraint({ name: "IsOrdinal", async: false })
class IsOrdinalConstraint implements ValidatorConstraintInterface {
    public validate(value: unknown, _: ValidationArguments): boolean {
        if (value instanceof Array) {
            return value.every((value) => this.singleValidate(value));
        } else {
            return this.singleValidate(value);
        }
    }

    public defaultMessage(args: ValidationArguments): string {
        return `Value of field "${String(args.property)}" must be a ordinal value.`;
    }

    private singleValidate(value: unknown): boolean {
        if (typeof value === "number") {
            return Number.isFinite(value);
        } else if (typeof value === "string") {
            const timestamp = Date.parse(value);
            return !isNaN(timestamp);
        } else if (value instanceof Date) {
            return Number.isFinite(value.getTime());
        } else {
            return false;
        }
    }
}

export function IsOrdinal(options?: ValidationOptions): PropertyDecorator {
    return (target, propertyName) => {
        registerDecorator({
            name: "IsOrdinal",
            target: target.constructor,
            propertyName: propertyName.toString(),
            validator: IsOrdinalConstraint,
            options,
        });
    };
}
