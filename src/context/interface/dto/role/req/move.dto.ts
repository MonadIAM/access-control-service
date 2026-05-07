import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";
import { MoveMode } from "~context/enums";

@ApiSchema({ name: "RoleMoveBody" })
export class MoveBodyDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public targetParent: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public target: string;

    @Expose()
    @Validator.IsEnum(MoveMode)
    @ApiProperty({ required: true, enum: MoveMode, enumName: "MoveMode" })
    declare public mode: MoveMode;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public reason: string;
}

@ApiSchema({ name: "RoleMoveQuery" })
export class MoveQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;
}
