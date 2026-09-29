import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { PublicOrdinalOperator } from "~infrastructure/database";

import { Validator } from "../validator";

@ApiSchema({ name: "OrdinalFilter" })
export class OrdinalFilterDTO<T extends Ordinal> {
    @Expose()
    @Validator.IsEnum(PublicOrdinalOperator)
    @ApiProperty({ required: true, enum: PublicOrdinalOperator, enumName: "PublicOrdinalOperator" })
    declare public operator: PublicOrdinalOperator;

    @Expose()
    @Validator.IsOrdinal()
    @ApiProperty({
        required: true,
        oneOf: [
            { type: "string" },
            { type: "number" },
            { type: "array", items: { oneOf: [{ type: "string" }, { type: "number" }] } },
        ],
    })
    declare public value: T | [T, T];
}
