import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { AccessControlActionType, AccessControlEntityType } from "~context/enums";
import { DeltaAuditLastActionsDTO } from "~common/dto";
import { Validator } from "~common/validator";

export class AuditJournalDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public id!: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public entity!: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public realm!: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public by!: string;

    @Expose()
    @Validator.IsDate()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: Date })
    public at?: Date;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public reason!: string;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => DeltaAuditLastActionsDTO)
    @ApiProperty({ required: true, type: DeltaAuditLastActionsDTO })
    public patch!: DeltaAudit.LastActionsSnapshot<unknown>;

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
