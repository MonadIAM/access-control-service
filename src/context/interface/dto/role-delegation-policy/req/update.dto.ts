import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";

class RoleDelegationPolicyPatchDTO {
    @Expose()
    @Validator.IsOptional()
    @Validator.IsPositiveInt()
    @ApiProperty({ required: false, type: Number })
    public depthLimit?: number;

    @Expose()
    @Validator.IsString()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: String })
    public description?: string;
}

export class UpdateRoleDelegationPolicyBodyDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public reason!: string;

    @Expose()
    @Type(() => RoleDelegationPolicyPatchDTO)
    @Validator.ValidateNested()
    @ApiProperty({ required: true, type: RoleDelegationPolicyPatchDTO })
    public patch!: RoleDelegationPolicyPatchDTO;
}

export class UpdateRoleDelegationPolicyQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public id!: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public realm!: string;
}
