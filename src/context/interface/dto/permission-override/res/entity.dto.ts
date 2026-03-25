import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { PermissionOverrideEffect } from "~context/enums";
import { Validator } from "~common/validator";

import { PermissionLookupDTO } from "../../permission";
import { RealmLookupDTO } from "../../realm";

export class PermissionOverrideDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public id!: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public account!: string;

    @Expose()
    @Validator.IsEnum(PermissionOverrideEffect)
    @ApiProperty({ required: true, enum: PermissionOverrideEffect, enumName: "PermissionOverrideEffect" })
    public effect!: PermissionOverrideEffect;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => PermissionLookupDTO)
    @ApiProperty({ required: true, type: PermissionLookupDTO })
    public permission!: PermissionLookupDTO;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => RealmLookupDTO)
    @ApiProperty({ required: true, type: RealmLookupDTO })
    public realm!: RealmLookupDTO;

    @Expose()
    @Validator.IsDate()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: Date })
    public updatedAt?: Date;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    public createdAt!: Date;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    public isRevoked!: boolean;

    @Expose()
    @Validator.IsInt()
    @ApiProperty({ required: true, type: Number })
    public version!: number;
}
