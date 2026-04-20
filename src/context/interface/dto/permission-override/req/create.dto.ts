import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { PermissionOverrideEffect } from "~context/enums";
import { Validator } from "~common/validator";

@ApiSchema({ name: "PermissionOverrideCreateBody" })
export class CreateBodyDTO {
    @Expose()
    @Validator.IsEnum(PermissionOverrideEffect)
    @ApiProperty({ required: true, enum: PermissionOverrideEffect, enumName: "PermissionOverrideEffect" })
    declare public effect: PermissionOverrideEffect;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public permission: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public account: string;
}

@ApiSchema({ name: "PermissionOverrideCreateQuery" })
export class CreateQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;
}
