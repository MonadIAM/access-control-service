import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "Pagination" })
export class PaginationDTO {
    @Expose()
    @Validator.IsPositive()
    @ApiProperty({ required: true, type: Number })
    declare public currentPage: number;

    @Expose()
    @Validator.IsInt()
    @Validator.IsIn([10, 25, 50, 100])
    @ApiProperty({ required: true, type: Number })
    declare public elementsPerPage: number;
}
