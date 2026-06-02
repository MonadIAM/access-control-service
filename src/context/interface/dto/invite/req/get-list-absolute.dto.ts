import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsNotEmptyObject } from "class-validator";
import { Expose, Type } from "class-transformer";

import { PaginationDTO } from "~common/dto";
import { Validator } from "~common/validator";

import { AbsoluteFiltersDTO } from "../utils/filters-absolute.dto";
import { SortDTO } from "../utils/sort.dto";

@ApiSchema({ name: "InviteAbsoluteListBody" })
export class GetListAbsoluteBodyDTO {
    @Expose()
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => PaginationDTO)
    @ApiProperty({ required: false, type: PaginationDTO })
    declare public pagination: PaginationDTO;

    @Expose()
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => AbsoluteFiltersDTO)
    @ApiProperty({ required: false, type: AbsoluteFiltersDTO })
    declare public filters: AbsoluteFiltersDTO;

    @Expose()
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => SortDTO)
    @ApiProperty({ required: false, type: SortDTO })
    declare public sort: SortDTO;
}
