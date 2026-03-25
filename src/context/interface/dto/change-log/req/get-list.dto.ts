import { IsNotEmptyObject, ValidateIf } from "class-validator";
import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";
import { PaginationDTO } from "~common/dto";

import { ChangeLogsFiltersDTO } from "../utils/filters.dto";
import { ChangeLogsSortDTO } from "../utils/sort.dto";

export class GetChangeLogsListBodyDTO {
    @Expose()
    @ValidateIf(({ pagination }) => pagination)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => PaginationDTO)
    @ApiProperty({ required: true, type: PaginationDTO })
    public pagination!: PaginationDTO;

    @Expose()
    @ValidateIf(({ filters }) => filters)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => ChangeLogsFiltersDTO)
    @ApiProperty({ required: true, type: ChangeLogsFiltersDTO })
    public filters!: ChangeLogsFiltersDTO;

    @Expose()
    @ValidateIf(({ sort }) => sort)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => ChangeLogsSortDTO)
    @ApiProperty({ required: true, type: ChangeLogsSortDTO })
    public sort!: ChangeLogsSortDTO;
}
