import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

export class RevokeRoleBodyDTO {
    @Expose()
    @Validator.IsArray()
    @Validator.ArrayMinSize(1)
    @Validator.ArrayMaxSize(50)
    @Validator.IsUUID("all", { each: true })
    @ApiProperty({ required: true, type: String })
    public identifiers!: string[];

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public reason!: string;
}

export class RevokeRoleQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public realm!: string;
}
