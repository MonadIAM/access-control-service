import { IsNotEmptyObject, ValidateIf } from "class-validator";
import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { BaseReadQueryDTO, PaginationDTO } from "~common/dto";
import { Validator } from "~common/validator";

import { RoleConflictGroupsFiltersDTO } from "../utils/filters.dto";
import { RoleConflictGroupsSortDTO } from "../utils/sort.dto";

export class GetRoleConflictGroupsListBodyDTO {
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
    @Type(() => RoleConflictGroupsFiltersDTO)
    @ApiProperty({ required: true, type: RoleConflictGroupsFiltersDTO })
    declare public filters: RoleConflictGroupsFiltersDTO;

    @Expose()
    @ValidateIf(({ sort }) => sort)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => RoleConflictGroupsSortDTO)
    @ApiProperty({ required: true, type: RoleConflictGroupsSortDTO })
    declare public sort: RoleConflictGroupsSortDTO;
}

export class GetRoleConflictGroupsListQueryDTO extends BaseReadQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;
}
