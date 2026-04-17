import { IsNotEmptyObject, ValidateIf } from "class-validator";
import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { BaseReadQueryDTO, PaginationDTO } from "~common/dto";
import { Validator } from "~common/validator";

import { RoleConflictMembersFiltersDTO } from "../utils/filters.dto";
import { RoleConflictMembersSortDTO } from "../utils/sort.dto";

export class GetRoleConflictMembersListBodyDTO {
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
    @Type(() => RoleConflictMembersFiltersDTO)
    @ApiProperty({ required: true, type: RoleConflictMembersFiltersDTO })
    declare public filters: RoleConflictMembersFiltersDTO;

    @Expose()
    @ValidateIf(({ sort }) => sort)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => RoleConflictMembersSortDTO)
    @ApiProperty({ required: true, type: RoleConflictMembersSortDTO })
    declare public sort: RoleConflictMembersSortDTO;
}

export class GetRoleConflictMembersListQueryDTO extends BaseReadQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public group: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;
}
