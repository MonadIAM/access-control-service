import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { UnknownType } from "@mikro-orm/core";
import { Expose } from "class-transformer";

import { ActionType, EntityType } from "~context/enums";
import { Validator } from "~common/validator";

@ApiSchema({ name: "AuditLog" })
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
    @ApiProperty({
        type: Object,
        required: true,
        additionalProperties: true,
    })
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
    @Validator.IsEnum(ActionType)
    @ApiProperty({ required: true, enum: ActionType, enumName: "ActionType" })
    declare public actionType: ActionType;

    @Expose()
    @Validator.IsEnum(EntityType)
    @ApiProperty({ required: true, enum: EntityType, enumName: "EntityType" })
    declare public entityType: EntityType;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    declare public createdAt: Date;
}
