import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";

class ListMetaDTO {
    @Expose()
    @Validator.IsInt()
    @ApiProperty({ required: true, type: Number })
    public totalElements!: number;

    @Expose()
    @Validator.IsInt()
    @ApiProperty({ required: true, type: Number })
    public totalPages!: number;

    @Expose()
    @Validator.IsInt()
    @Validator.IsIn([10, 25, 50, 100])
    @ApiProperty({ required: true, type: Number })
    public elementsPerPage!: number;

    @Expose()
    @Validator.IsInt()
    @ApiProperty({ required: true, type: Number })
    public currentPage!: number;
}

export class BaseListDTO<T> {
    @Expose()
    @Validator.IsArray()
    @Validator.ValidateNested({ each: true })
    public data!: T[];

    @Expose()
    @Validator.IsOptional()
    @Type(() => ListMetaDTO)
    @Validator.ValidateNested()
    @ApiProperty({ required: false, type: ListMetaDTO })
    public meta?: ListMetaDTO;
}
