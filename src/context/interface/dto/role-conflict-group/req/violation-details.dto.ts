import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

export class GetViolationDetailsBodyDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public account!: string;

    @Expose()
    @Validator.IsArray()
    @Validator.ArrayMinSize(1)
    @Validator.IsUUID("all", { each: true })
    @ApiProperty({ required: true, type: [String], format: "uuid" })
    public roles!: string[];
}

export class GetViolationDetailsQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public realm!: string;
}
