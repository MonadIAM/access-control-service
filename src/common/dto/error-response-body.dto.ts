import { UnknownType } from "@mikro-orm/postgresql";
import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";

class ValidationErrorDetailDTO {
    @Expose()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: UnknownType })
    public invalidValue?: unknown;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public constraint!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public message!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public path!: string;
}

export class ErrorResponseBodyDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public error!: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiProperty({ required: false, type: String })
    public path?: string;

    @Expose()
    @Validator.IsPositiveInt()
    @ApiProperty({ required: true, type: Number })
    public statusCode!: number;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiProperty({ required: false, type: String })
    public timestamp?: string;

    @Expose()
    @Validator.IsListOrSingleString()
    @ApiProperty({ required: true, oneOf: [{ type: "array", items: { type: "string" } }, { type: "string" }] })
    public message!: string | string[];

    @Expose()
    @Validator.IsOptional()
    @Type(() => ValidationErrorDetailDTO)
    @Validator.IsArray()
    @ApiProperty({ required: false, type: [ValidationErrorDetailDTO] })
    public details?: ValidationErrorDetailDTO[];
}
