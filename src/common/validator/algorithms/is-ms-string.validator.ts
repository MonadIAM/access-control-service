import {
    ValidatorConstraintInterface,
    ValidatorConstraint,
    ValidationArguments,
    ValidationOptions,
    registerDecorator,
} from "class-validator";
import ms from "ms";

@ValidatorConstraint({ name: "IsMsString", async: false })
class IsMsStringConstraint implements ValidatorConstraintInterface {
    public validate(value: unknown, _: ValidationArguments): boolean {
        return typeof value === "string" && ms(value) !== undefined;
    }

    public defaultMessage(args: ValidationArguments): string {
        return `Value of field "${String(args.property)}" must be a valid time string (e.g. "1s", "5m", "1h", "1y").`;
    }
}

export function IsMsString(options?: ValidationOptions): PropertyDecorator {
    return (target, propertyName) => {
        registerDecorator({
            name: "IsMsString",
            target: target.constructor,
            propertyName: propertyName.toString(),
            validator: IsMsStringConstraint,
            options,
        });
    };
}
