import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

export class CreateRoleConflictGroupBodyDTO {
    @Expose()
    @Validator.IsUniqueArray()
    @Validator.ArrayMaxSize(Number(process.env.BULK_OPERATION_LIMIT))
    @Validator.IsUUID("4", { each: true })
    @ApiProperty({ required: true, type: [String], format: "uuid" })
    public members!: string[];

    @Expose()
    @Validator.IsInt()
    @ApiProperty({ required: true, type: Number })
    public maxAllowed!: number;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public description!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public code!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public name!: string;
}

export class CreateRoleConflictGroupQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public realm!: string;
}
