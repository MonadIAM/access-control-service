import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";

class RoleDelegationPolicyPatchDTO {
    @Expose()
    @Validator.IsOptional()
    @Validator.IsPositiveInt()
    @ApiProperty({ required: false, type: Number })
    declare public depthLimit?: number;

    @Expose()
    @Validator.IsString()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: String })
    declare public description?: string;
}

export class UpdateRoleDelegationPolicyBodyDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public reason: string;

    @Expose()
    @Type(() => RoleDelegationPolicyPatchDTO)
    @Validator.ValidateNested()
    @ApiProperty({ required: true, type: RoleDelegationPolicyPatchDTO })
    declare public patch: RoleDelegationPolicyPatchDTO;
}

export class UpdateRoleDelegationPolicyQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public id: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;
}
