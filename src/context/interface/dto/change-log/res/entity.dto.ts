import { ChangeSetType } from "@mikro-orm/postgresql";
import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { AccessControlEntityType } from "~context/enums";
import { DeltaAuditLastActionsDTO } from "~common/dto";
import { Validator } from "~common/validator";

export class ChangeLogDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public id!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public auditEntry!: string;

    @Expose()
    @Validator.IsEnum(ChangeSetType)
    @ApiProperty({ required: true, enum: ChangeSetType, enumName: "ChangeSetType" })
    public changeType!: ChangeSetType;

    @Expose()
    @Validator.IsEnum(AccessControlEntityType)
    @ApiProperty({ required: true, enum: AccessControlEntityType, enumName: "AccessControlEntityType" })
    public entityType!: AccessControlEntityType;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public entity!: string;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => DeltaAuditLastActionsDTO)
    @ApiProperty({ required: true, type: DeltaAuditLastActionsDTO })
    public delta!: DeltaAudit.LastActionsSnapshot<unknown>;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    public createdAt!: Date;
}
