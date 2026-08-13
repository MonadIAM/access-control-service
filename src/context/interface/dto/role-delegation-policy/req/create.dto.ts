import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "RoleDelegationPolicyCreateBody" })
export class CreateBodyDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public delegator: string;

    @Expose()
    @Validator.IsUUID()
    @Validator.NotEqualTo("delegator")
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public target: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsPositiveInt()
    @ApiProperty({ required: false, type: Number })
    declare public depthLimit?: number;

    @Expose()
    @Validator.IsString()
    @Validator.MinLength(1)
    @ApiProperty({ required: true, type: String })
    declare public justification: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsDate()
    @ApiProperty({ required: false, type: Date })
    declare public expiresAt?: Date;
}

@ApiSchema({ name: "RoleDelegationPolicyCreateQuery" })
export class CreateQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;
}
