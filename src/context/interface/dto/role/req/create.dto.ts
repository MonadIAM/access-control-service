import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { RoleActorType, RoleProtoType } from "~context/enums";
import { Validator } from "~common/validator";

export class CreateRoleBodyDTO {
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
    @ApiProperty({ required: false, type: String })
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
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    public nonDelegable!: boolean;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public parent!: string;

    @Expose()
    @Validator.IsUniqueArray()
    @Validator.IsUUID("4", { each: true })
    @ApiProperty({ required: true, type: [String], format: "uuid" })
    public children!: string[];
}

export class CreateRoleQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public realm!: string;
}
