import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * provides matching constraints on two values synchronously
 *
 */
@ValidatorConstraint({ async: false })
export class MatchConstraint implements ValidatorConstraintInterface {
  // validates the given value matches the related value
  validate(value: unknown, args: ValidationArguments) {
    // obtains the name of the field to be compared against
    const [relatedPropertyName] = args.constraints;
    // obtains the value of that field from the object
    const relatedValue = (args.object as unknown)[relatedPropertyName];
    return value === relatedValue;
  }

  // default error message, if validation is false
  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    return `${args.property} must match ${relatedPropertyName}`;
  }
}

/**
 *
 * @param property key to the value to compare against
 * @param validationOptions validation option, such as message.
 * @returns true if match, otherwise false with error message
 */
export function isEqualTo(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: MatchConstraint,
    });
  };
}
