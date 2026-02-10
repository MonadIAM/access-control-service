export enum PublicOrdinalOperator {
    EQUAL = "EQUAL",
    NOT_EQUAL = "NOT_EQUAL",
    IN = "IN",
    NOT_IN = "NOT_IN",
    GREATER_THAN = "GREATER_THAN",
    GREATER_OR_EQUAL = "GREATER_OR_EQUAL",
    LESS_THAN = "LESS_THAN",
    LESS_OR_EQUAL = "LESS_OR_EQUAL",
    BETWEEN = "BETWEEN",
}

export enum PublicStringOperator {
    EQUAL = "EQUAL",
    NOT_EQUAL = "NOT_EQUAL",
    IN = "IN",
    NOT_IN = "NOT_IN",
    LIKE = "LIKE",
    ILIKE = "ILIKE",
}

export enum PublicLinkOperator {
    EQUAL = "EQUAL",
    NOT_EQUAL = "NOT_EQUAL",
    IN = "IN",
    NOT_IN = "NOT_IN",
}

export enum ORMOperator {
    EQUAL = "$eq",
    NOT_EQUAL = "$ne",
    IN = "$in",
    NOT_IN = "$nin",
    GREATER_THAN = "$gt",
    GREATER_OR_EQUAL = "$gte",
    LESS_THAN = "$lt",
    LESS_OR_EQUAL = "$lte",
    LIKE = "$like",
    ILIKE = "$ilike",
}
