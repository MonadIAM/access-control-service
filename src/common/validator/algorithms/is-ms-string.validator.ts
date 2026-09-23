import ms, { StringValue } from "ms";
import {
    ValidatorConstraintInterface,
    ValidatorConstraint,
    ValidationArguments,
    ValidationOptions,
    registerDecorator,
} from "class-validator";

@ValidatorConstraint({ name: "IsMsString", async: false })
class IsMsStringConstraint implements ValidatorConstraintInterface {
    public validate(value: unknown, _: ValidationArguments): boolean {
        if (typeof value !== "string" || value.length === 0) {
            return false;
        } else {
            const duration = ms(value as StringValue);
            return Number.isFinite(duration) && duration >= 0;
        }
    }

    public defaultMessage(args: ValidationArguments): string {
        return `Value of field "${String(args.property)}" must be a valid time string (e.g. "1s", "5m", "1h").`;
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
