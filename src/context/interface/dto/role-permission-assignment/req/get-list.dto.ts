import { IsNotEmptyObject, ValidateIf } from "class-validator";
import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { BaseReadQueryDTO, PaginationDTO } from "~common/dto";
import { Validator } from "~common/validator";

import { RolePermissionAssignmentsFiltersDTO } from "../utils/filters.dto";
import { RolePermissionAssignmentsSortDTO } from "../utils/sort.dto";

export class GetRolePermissionAssignmentsListBodyDTO {
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
    @Type(() => RolePermissionAssignmentsFiltersDTO)
    @ApiProperty({ required: true, type: RolePermissionAssignmentsFiltersDTO })
    declare public filters: RolePermissionAssignmentsFiltersDTO;

    @Expose()
    @ValidateIf(({ sort }) => sort)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => RolePermissionAssignmentsSortDTO)
    @ApiProperty({ required: true, type: RolePermissionAssignmentsSortDTO })
    declare public sort: RolePermissionAssignmentsSortDTO;
}

export class GetRolePermissionAssignmentsListQueryDTO extends BaseReadQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;
}
