import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

export class CreateRolePermissionAssignmentBodyDTO {
    @Expose()
    @Validator.IsArray()
    @Validator.ArrayMinSize(1)
    @Validator.ArrayMaxSize(50)
    @Validator.IsUUID("all", { each: true })
    @ApiProperty({ required: true, type: String })
    public permissions!: string[];

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public role!: string;
}

export class CreateRolePermissionAssignmentQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public realm!: string;
}
