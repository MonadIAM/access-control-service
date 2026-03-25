import { UnknownType } from "@mikro-orm/core";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { Validator } from "~common/validator";

export class AuditLogDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public id!: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public realm!: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public actor!: string;

    @Expose()
    @ApiProperty({ required: true, type: UnknownType })
    public input!: UnknownType;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public ip!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public userAgent!: string;

    @Expose()
    @Validator.IsEnum(AccessControlActionType)
    @ApiProperty({ required: true, enum: AccessControlActionType, enumName: "AccessControlActionType" })
    public actionType!: AccessControlActionType;

    @Expose()
    @Validator.IsEnum(AccessControlEntityType)
    @ApiProperty({ required: true, enum: AccessControlEntityType, enumName: "AccessControlEntityType" })
    public entityType!: AccessControlEntityType;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    public createdAt!: Date;
}
