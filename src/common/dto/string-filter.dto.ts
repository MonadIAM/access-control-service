import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { PublicStringOperator } from "~infrastructure/database/enums";

import { Validator } from "../validator";

@ApiSchema({ name: "StringFilter" })
export class StringFilterDTO {
    @Expose()
    @Validator.IsEnum(PublicStringOperator)
    @ApiProperty({ required: true, enum: PublicStringOperator, enumName: "PublicStringOperator" })
    declare public operator: PublicStringOperator;

    @Expose()
    @Validator.IsListOrSingleString()
    @ApiProperty({
        required: true,
        type: Object,
        oneOf: [{ type: "array", items: { type: "string" } }, { type: "string" }],
    })
    declare public value: string | string[];
}
