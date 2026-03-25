import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { DeltaAuditLastActionsDTO } from "~common/dto";
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
    @Validator.ValidateNested()
    @Type(() => DeltaAuditLastActionsDTO)
    @ApiProperty({ required: true, type: DeltaAuditLastActionsDTO })
    public input!: DeltaAudit.LastActionsSnapshot<unknown>;

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
