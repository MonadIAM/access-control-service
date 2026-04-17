import { IsNotEmptyObject, ValidateIf } from "class-validator";
import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { BaseReadQueryDTO, PaginationDTO } from "~common/dto";
import { Validator } from "~common/validator";

import { RoleDelegationPoliciesFiltersDTO } from "../utils/filters.dto";
import { RoleDelegationPoliciesSortDTO } from "../utils/sort.dto";

export class GetRoleDelegationPoliciesListBodyDTO {
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
    @Type(() => RoleDelegationPoliciesFiltersDTO)
    @ApiProperty({ required: true, type: RoleDelegationPoliciesFiltersDTO })
    declare public filters: RoleDelegationPoliciesFiltersDTO;

    @Expose()
    @ValidateIf(({ sort }) => sort)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => RoleDelegationPoliciesSortDTO)
    @ApiProperty({ required: true, type: RoleDelegationPoliciesSortDTO })
    declare public sort: RoleDelegationPoliciesSortDTO;
}

export class GetRoleDelegationPoliciesListQueryDTO extends BaseReadQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;
}
