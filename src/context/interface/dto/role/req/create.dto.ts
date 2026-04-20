import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { RoleActorType, RoleProtoType } from "~context/enums";
import { Validator } from "~common/validator";

@ApiSchema({ name: "RoleCreateBody" })
export class CreateBodyDTO {
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
    @Validator.IsEnum(RoleActorType)
    @ApiProperty({ required: true, enum: RoleActorType, enumName: "RoleActorType" })
    declare public actorType: RoleActorType;

    @Expose()
    @Validator.IsEnum(RoleProtoType)
    @ApiProperty({ required: true, enum: RoleProtoType, enumName: "RoleProtoType" })
    declare public protoType: RoleProtoType;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    declare public nonDelegable: boolean;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public parent: string;

    @Expose()
    @Validator.IsUniqueArray()
    @Validator.IsUUID("4", { each: true })
    @ApiProperty({ required: true, type: [String], format: "uuid" })
    declare public children: string[];
}

@ApiSchema({ name: "RoleCreateQuery" })
export class CreateQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;
}
