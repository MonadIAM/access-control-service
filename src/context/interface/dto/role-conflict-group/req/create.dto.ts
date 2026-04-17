import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

export class CreateRoleConflictGroupBodyDTO {
    @Expose()
    @Validator.IsUniqueArray()
    @Validator.ArrayMaxSize(Number(process.env.BULK_OPERATION_LIMIT))
    @Validator.IsUUID("4", { each: true })
    @ApiProperty({ required: true, type: [String], format: "uuid" })
    declare public members: string[];

    @Expose()
    @Validator.IsInt()
    @ApiProperty({ required: true, type: Number })
    declare public maxAllowed: number;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public description: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public code: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public name: string;
}

export class CreateRoleConflictGroupQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;
}
