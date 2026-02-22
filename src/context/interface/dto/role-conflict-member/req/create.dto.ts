import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

export class CreateRoleConflictMemberBodyDTO {
    @Expose()
    @Validator.IsArray()
    @Validator.ArrayMinSize(1)
    @Validator.ArrayMaxSize(50)
    @Validator.IsUUID("all", { each: true })
    @ApiProperty({ required: true, type: [String] })
    public roles!: string[];

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public group!: string;
}

export class CreateRoleConflictMemberQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public realm!: string;
}
