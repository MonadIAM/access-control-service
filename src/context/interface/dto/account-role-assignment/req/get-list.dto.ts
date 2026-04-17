import { IsNotEmptyObject, ValidateIf } from "class-validator";
import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { BaseReadQueryDTO, PaginationDTO } from "~common/dto";
import { Validator } from "~common/validator";

import { AccountRoleAssignmentsFiltersDTO } from "../utils/filters.dto";
import { AccountRoleAssignmentsSortDTO } from "../utils/sort.dto";

export class GetAccountRoleAssignmentsListBodyDTO {
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
    @Type(() => AccountRoleAssignmentsFiltersDTO)
    @ApiProperty({ required: true, type: AccountRoleAssignmentsFiltersDTO })
    declare public filters: AccountRoleAssignmentsFiltersDTO;

    @Expose()
    @ValidateIf(({ sort }) => sort)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => AccountRoleAssignmentsSortDTO)
    @ApiProperty({ required: true, type: AccountRoleAssignmentsSortDTO })
    declare public sort: AccountRoleAssignmentsSortDTO;
}

export class GetAccountRoleAssignmentsListQueryDTO extends BaseReadQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;
}
