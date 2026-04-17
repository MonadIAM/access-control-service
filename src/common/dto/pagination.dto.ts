import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";

export class PaginationDTO {
    @Expose()
    @Type(() => Number)
    @Validator.IsPositive()
    @ApiProperty({ required: true, type: Number })
    declare public currentPage: number;

    @Expose()
    @Type(() => Number)
    @Validator.IsInt()
    @Validator.IsIn([10, 25, 50, 100])
    @ApiProperty({ required: true, type: Number })
    declare public elementsPerPage: number;
}
