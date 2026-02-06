import {
    ValidatorConstraintInterface,
    ValidatorConstraint,
    ValidationArguments,
    ValidationOptions,
    registerDecorator,
} from "class-validator";

@ValidatorConstraint({ name: "IsOrdinal", async: false })
class IsOrdinalConstraint implements ValidatorConstraintInterface {
    public validate(value: unknown): boolean {
        if (typeof value === "number") {
            return Number.isFinite(value);
        } else if (value instanceof Date) {
            return Number.isFinite(value.getTime());
        } else {
            return false;
        }
    }
    public defaultMessage(args: ValidationArguments): string {
        return `Value of field "${String(args.property)}" must be a ordinal value.`;
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
