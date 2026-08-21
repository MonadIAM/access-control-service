import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "ValidationErrorDetails" })
class ValidationErrorDetailsDTO {
    @Expose()
    @Validator.IsOptional()
    @ApiProperty({
        required: false,
        nullable: true,
        type: Object,
        oneOf: [
            { type: "object", additionalProperties: true },
            { type: "array", items: {} },
            { type: "boolean" },
            { type: "string" },
            { type: "number" },
        ],
    })
    declare public invalidValue?: ORM.UnknownType;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public constraint: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public message: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public path: string;
}

@ApiSchema({ name: "ErrorResponseBody" })
export class ErrorResponseBodyDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public error: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiProperty({ required: false, type: String })
    declare public path?: string;

    @Expose()
    @Validator.IsPositiveInt()
    @ApiProperty({ required: true, type: Number })
    declare public statusCode: number;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiProperty({ required: false, type: String })
    declare public timestamp?: string;

    @Expose()
    @Validator.IsListOrSingleString()
    @ApiProperty({
        required: true,
        type: Object,
        oneOf: [{ type: "array", items: { type: "string" } }, { type: "string" }],
    })
    declare public message: string | string[];

    @Expose()
    @Validator.IsOptional()
    @Type(() => ValidationErrorDetailsDTO)
    @Validator.IsArray()
    @ApiProperty({ required: false, type: [ValidationErrorDetailsDTO] })
    declare public details?: ValidationErrorDetailsDTO[];
}
