import { PublicOrdinalOperator, PublicStringOperator, ORMOperator } from "../enums";

export const PUBLIC_TO_ORM_OPERATORS: Record<
    Exclude<PublicOrdinalOperator, "BETWEEN"> | PublicStringOperator,
    ORMOperator
> = {
    /* eslint-disable prettier/prettier */
    [PublicOrdinalOperator.EQUAL]:            ORMOperator.EQUAL,
    [PublicOrdinalOperator.NOT_EQUAL]:        ORMOperator.NOT_EQUAL,
    [PublicOrdinalOperator.IN]:               ORMOperator.IN,
    [PublicOrdinalOperator.NOT_IN]:           ORMOperator.NOT_IN,
    [PublicOrdinalOperator.GREATER_THAN]:     ORMOperator.GREATER_THAN,
    [PublicOrdinalOperator.GREATER_OR_EQUAL]: ORMOperator.GREATER_OR_EQUAL,
    [PublicOrdinalOperator.LESS_THAN]:        ORMOperator.LESS_THAN,
    [PublicOrdinalOperator.LESS_OR_EQUAL]:    ORMOperator.LESS_OR_EQUAL,
    [PublicStringOperator.LIKE]:              ORMOperator.LIKE,
    [PublicStringOperator.ILIKE]:             ORMOperator.ILIKE,
    /* eslint-enable prettier/prettier */
};
