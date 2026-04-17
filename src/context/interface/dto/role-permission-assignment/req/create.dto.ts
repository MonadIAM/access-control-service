import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

export class CreateRolePermissionAssignmentBodyDTO {
    @Expose()
    @Validator.IsUniqueArray()
    @Validator.ArrayMinSize(1)
    @Validator.ArrayMaxSize(Number(process.env.BULK_OPERATION_LIMIT))
    @Validator.IsUUID("4", { each: true })
    @ApiProperty({ required: true, type: [String], format: "uuid" })
    declare public permissions: string[];

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public role: string;
}

export class CreateRolePermissionAssignmentQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;
}
