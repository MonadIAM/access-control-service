import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { RoleActorType, RoleProtoType } from "~context/enums";
import { DeltaAuditLastActionsDTO } from "~common/dto";
import { Validator } from "~common/validator";

import { RealmLookupDTO } from "../../realm";

export class RoleDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public id!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public code!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public name!: string;

    @Expose()
    @Validator.IsString()
    @Validator.IsOptional()
    @ApiProperty({ required: true, type: String })
    public description?: string;

    @Expose()
    @Validator.IsEnum(RoleActorType)
    @ApiProperty({ required: true, enum: RoleActorType, enumName: "RoleActorType" })
    public actorType!: RoleActorType;

    @Expose()
    @Validator.IsEnum(RoleProtoType)
    @ApiProperty({ required: true, enum: RoleProtoType, enumName: "RoleProtoType" })
    public protoType!: RoleProtoType;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => RealmLookupDTO)
    @ApiProperty({ required: true, type: RealmLookupDTO })
    public realm!: RealmLookupDTO;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    public nonDelegable!: boolean;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    public isSystemManaged!: boolean;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    public isRevoked!: boolean;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    public createdAt!: Date;

    @Expose()
    @Validator.IsDate()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: Date })
    public updatedAt?: Date;

    @Expose()
    @Validator.IsInt()
    @ApiProperty({ required: true, type: Number })
    public version!: number;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => DeltaAuditLastActionsDTO)
    @ApiProperty({ required: true, type: DeltaAuditLastActionsDTO })
    public lastActions!: DeltaAudit.LastActionsSnapshot<Entities.Role.MutableFields>;
}
