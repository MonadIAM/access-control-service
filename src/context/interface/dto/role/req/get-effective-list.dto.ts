import { IsNotEmptyObject, ValidateIf } from "class-validator";
import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";
import { PaginationDTO } from "~common/dto";

import { RolesFiltersDTO } from "../utils/filters.dto";
import { RolesSortDTO } from "../utils/sort.dto";

export class GetEffectiveRolesListBodyDTO {
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
    @Type(() => RolesFiltersDTO)
    @ApiProperty({ required: true, type: RolesFiltersDTO })
    declare public filters: RolesFiltersDTO;

    @Expose()
    @ValidateIf(({ sort }) => sort)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => RolesSortDTO)
    @ApiProperty({ required: true, type: RolesSortDTO })
    declare public sort: RolesSortDTO;
}

export class GetEffectiveRolesListQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;

    @Expose()
    @Validator.IsUUID()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: String, format: "uuid" })
    declare public account?: string;
}
