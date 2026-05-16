import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { RoleActorType, RolePrototype } from "~context/enums";
import { Validator } from "~common/validator";

import { RealmLookupDTO } from "../../realm";

@ApiSchema({ name: "Role" })
export class RoleDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public id: string;

    @Expose()
    @Validator.IsEnum(RoleActorType)
    @ApiProperty({ required: true, enum: RoleActorType, enumName: "RoleActorType" })
    declare public actorType: RoleActorType;

    @Expose()
    @Validator.IsEnum(RolePrototype)
    @ApiProperty({ required: true, enum: RolePrototype, enumName: "RolePrototype" })
    declare public prototype: RolePrototype;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    declare public isSystemManaged: boolean;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    declare public nonDelegable: boolean;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public code: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public name: string;

    @Expose()
    @Validator.IsString()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: String })
    declare public description?: string;

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
