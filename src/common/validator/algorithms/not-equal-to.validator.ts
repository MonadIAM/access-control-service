import {
    ValidatorConstraintInterface,
    ValidatorConstraint,
    ValidationArguments,
    ValidationOptions,
    registerDecorator,
} from "class-validator";

@ValidatorConstraint({ name: "NotEqualTo", async: false })
class NotEqualToConstraint implements ValidatorConstraintInterface {
    public validate(value: unknown, args: ValidationArguments): boolean {
        const [relatedPropertyName] = args.constraints;
        const relatedValue = (args.object as UnknownObject)[relatedPropertyName];
        return value !== relatedValue;
    }

    public defaultMessage(args: ValidationArguments): string {
        const [relatedPropertyName] = args.constraints;
        return `Field "${args.property}" must not be equal to "${relatedPropertyName}".`;
    }
}

export function NotEqualTo(property: string, options?: ValidationOptions): PropertyDecorator {
    return (target, propertyName) => {
        registerDecorator({
            name: "NotEqualTo",
            target: target.constructor,
            propertyName: propertyName.toString(),
            constraints: [property],
            validator: NotEqualToConstraint,
            options,
        });
    };
}
