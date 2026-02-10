import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { PublicOrdinalOperator } from "~infrastructure/database";

import { Validator } from "../validator";

export class OrdinalFilterDTO<T extends Ordinal> {
    @Expose()
    @Validator.IsEnum(PublicOrdinalOperator)
    @ApiProperty({ required: true, enum: PublicOrdinalOperator, enumName: "PublicOrdinalOperator" })
    public operator!: PublicOrdinalOperator;

    @Expose()
    @Validator.IsOrdinal()
    @ApiProperty({
        required: true,
        oneOf: [{ type: "Date" }, { type: "number" }, { type: "array", oneOf: [{ type: "Date" }, { type: "number" }] }],
    })
    public value!: T | [T, T] | T[];
}
