import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

export class CreateRoleDelegationPolicyBodyDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public delegator!: string;

    @Expose()
    @Validator.IsUUID()
    @Validator.NotEqualTo("delegator")
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public target!: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsPositiveInt()
    @ApiProperty({ required: false, type: Number })
    public depthLimit?: number;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public description!: string;
}

export class CreateRoleDelegationPolicyQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public realm!: string;
}
