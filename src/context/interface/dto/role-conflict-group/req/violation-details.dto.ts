import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

export class GetViolationDetailsBodyDTO {
    @Expose()
    @Validator.IsUniqueArray()
    @Validator.ArrayMinSize(1)
    @Validator.IsUUID("4", { each: true })
    @ApiProperty({ required: true, type: [String], format: "uuid" })
    declare public roles: string[];

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public account: string;
}

export class GetViolationDetailsQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;
}
