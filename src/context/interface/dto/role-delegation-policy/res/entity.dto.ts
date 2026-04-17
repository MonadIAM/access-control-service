import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";

import { RealmLookupDTO } from "../../realm";
import { RoleLookupDTO } from "../../role";

export class RoleDelegationPolicyDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public id: string;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    declare public isSystemManaged: boolean;

    @Expose()
    @Validator.IsPositiveInt()
    @ApiProperty({ required: true, type: Number })
    declare public depthLimit: number;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public description: string;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => RealmLookupDTO)
    @ApiProperty({ required: true, type: RealmLookupDTO })
    declare public realm: RealmLookupDTO;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => RoleLookupDTO)
    @ApiProperty({ required: true, type: RoleLookupDTO })
    declare public delegator: RoleLookupDTO;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => RoleLookupDTO)
    @ApiProperty({ required: true, type: RoleLookupDTO })
    declare public target: RoleLookupDTO;

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
