import { IsNotEmptyObject, ValidateIf } from "class-validator";
import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";
import { PaginationDTO } from "~common/dto";

import { RealmsFiltersDTO } from "../utils/filters.dto";
import { RealmsSortDTO } from "../utils/sort.dto";

export class GetRealmsListBodyDTO {
    @Expose()
    @ValidateIf(({ pagination }) => pagination)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => PaginationDTO)
    @ApiProperty({ required: true, type: PaginationDTO })
    declare public pagination: PaginationDTO;

    @Expose()
    @ValidateIf(({ filters }) => filters)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => RealmsFiltersDTO)
    @ApiProperty({ required: true, type: RealmsFiltersDTO })
    declare public filters: RealmsFiltersDTO;

    @Expose()
    @ValidateIf(({ sort }) => sort)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => RealmsSortDTO)
    @ApiProperty({ required: true, type: RealmsSortDTO })
    declare public sort: RealmsSortDTO;
}
