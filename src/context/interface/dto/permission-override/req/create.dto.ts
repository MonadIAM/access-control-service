import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { PermissionOverrideEffect } from "~context/enums";
import { Validator } from "~common/validator";

export class CreatePermissionOverrideBodyDTO {
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

export class CreatePermissionOverrideQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;
}
