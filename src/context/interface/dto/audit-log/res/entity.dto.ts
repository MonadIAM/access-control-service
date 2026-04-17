import { UnknownType } from "@mikro-orm/core";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { Validator } from "~common/validator";

export class AuditLogDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public id: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public actor: string;

    @Expose()
    @ApiProperty({ required: true, type: UnknownType })
    declare public input: UnknownType;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public ip: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public userAgent: string;

    @Expose()
    @Validator.IsEnum(AccessControlActionType)
    @ApiProperty({ required: true, enum: AccessControlActionType, enumName: "AccessControlActionType" })
    declare public actionType: AccessControlActionType;

    @Expose()
    @Validator.IsEnum(AccessControlEntityType)
    @ApiProperty({ required: true, enum: AccessControlEntityType, enumName: "AccessControlEntityType" })
    declare public entityType: AccessControlEntityType;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    declare public createdAt: Date;
}
