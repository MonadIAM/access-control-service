import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "ListMeta" })
class ListMetaDTO {
    @Expose()
    @Validator.IsInt()
    @ApiProperty({ required: true, type: Number })
    declare public totalElements: number;

    @Expose()
    @Validator.IsInt()
    @ApiProperty({ required: true, type: Number })
    declare public totalPages: number;

    @Expose()
    @Validator.IsInt()
    @Validator.IsIn([10, 25, 50, 100])
    @ApiProperty({ required: true, type: Number })
    declare public elementsPerPage: number;

    @Expose()
    @Validator.IsInt()
    @ApiProperty({ required: true, type: Number })
    declare public currentPage: number;
}

@ApiSchema({ name: "BaseList" })
export class BaseListDTO<T> {
    @Expose()
    @Validator.IsArray()
    @Validator.ValidateNested({ each: true })
    declare public data: T[];

    @Expose()
    @Validator.IsOptional()
    @Type(() => ListMetaDTO)
    @Validator.ValidateNested()
    @ApiProperty({ required: false, type: ListMetaDTO })
    declare public meta?: ListMetaDTO;
}
