import { ChangeSetType, UnknownType } from "@mikro-orm/postgresql";
import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { AccessControlEntityType } from "~context/enums";
import { Validator } from "~common/validator";

@ApiSchema({ name: "ChangeLog" })
export class ChangeLogDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public id: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public auditEntry: string;

    @Expose()
    @Validator.IsEnum(ChangeSetType)
    @ApiProperty({ required: true, enum: ChangeSetType, enumName: "ChangeSetType" })
    declare public changeType: ChangeSetType;

    @Expose()
    @Validator.IsEnum(AccessControlEntityType)
    @ApiProperty({ required: true, enum: AccessControlEntityType, enumName: "AccessControlEntityType" })
    declare public entityType: AccessControlEntityType;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public entity: string;

    @Expose()
    @ApiProperty({
        type: Object,
        required: true,
        additionalProperties: true,
    })
    declare public delta: UnknownType;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    declare public createdAt: Date;
}
