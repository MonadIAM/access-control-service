import { Expose, Type } from "class-transformer";
import { ApiProperty, ApiSchema } from "@nestjs/swagger";

import { PermissionOverrideEffect } from "~context/enums";
import { Validator } from "~common/validator";

import { PermissionLookupDTO } from "../../permission";
import { RealmLookupDTO } from "../../realm";

@ApiSchema({ name: "PermissionOverride" })
export class PermissionOverrideDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public id: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public account: string;

    @Expose()
    @Validator.IsEnum(PermissionOverrideEffect)
    @ApiProperty({ required: true, enum: PermissionOverrideEffect, enumName: "PermissionOverrideEffect" })
    declare public effect: PermissionOverrideEffect;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => PermissionLookupDTO)
    @ApiProperty({ required: true, type: PermissionLookupDTO })
    declare public permission: PermissionLookupDTO;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => RealmLookupDTO)
    @ApiProperty({ required: true, type: RealmLookupDTO })
    declare public realm: RealmLookupDTO;

    @Expose()
    @Validator.IsDate()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: Date })
    declare public updatedAt?: Date;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    declare public createdAt: Date;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    declare public isRevoked: boolean;

    @Expose()
    @Validator.IsInt()
    @ApiProperty({ required: true, type: Number })
    declare public version: number;
}
