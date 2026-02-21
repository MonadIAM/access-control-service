import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";

class RoleConflictGroupPatchDTO {
    @Expose()
    @Validator.IsString()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: String })
    public name?: string;

    @Expose()
    @Validator.IsString()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: String })
    public description?: string;
}

export class UpdateRoleConflictGroupBodyDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public reason!: string;

    @Expose()
    @Type(() => RoleConflictGroupPatchDTO)
    @Validator.ValidateNested()
    @ApiProperty({ required: true, type: RoleConflictGroupPatchDTO })
    public patch!: RoleConflictGroupPatchDTO;
}

export class UpdateRoleConflictGroupQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public id!: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public realm!: string;
}
