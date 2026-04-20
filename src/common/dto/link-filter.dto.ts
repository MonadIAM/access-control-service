import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { PublicLinkOperator } from "~infrastructure/database/enums";

import { Validator } from "../validator";

@ApiSchema({ name: "LinkFilter" })
export class LinkFilterDTO {
    @Expose()
    @Validator.IsEnum(PublicLinkOperator)
    @ApiProperty({ required: true, enum: PublicLinkOperator, enumName: "PublicLinkOperator" })
    declare public operator: PublicLinkOperator;

    @Expose()
    @Validator.IsListOrSingleString()
    @ApiProperty({ required: true, oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] })
    declare public value: string | string[];
}
