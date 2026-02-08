import { IsNotEmptyObject, ValidateIf } from "class-validator";
import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { BaseReadQueryDTO, PaginationDTO } from "~common/dto";
import { Validator } from "~common/validator";

import { RolePermissionMatricesFiltersDTO } from "../utils/filters.dto";
import { RolePermissionMatricesSortDTO } from "../utils/sort.dto";

export class GetRolePermissionMatricesListBodyDTO {
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
    @Type(() => RolePermissionMatricesFiltersDTO)
    @ApiProperty({ required: true, type: RolePermissionMatricesFiltersDTO })
    public filters!: RolePermissionMatricesFiltersDTO;

    @Expose()
    @ValidateIf(({ sort }) => sort)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => RolePermissionMatricesSortDTO)
    @ApiProperty({ required: true, type: RolePermissionMatricesSortDTO })
    public sort!: RolePermissionMatricesSortDTO;
}

export class GetRolePermissionMatricesListQueryDTO extends BaseReadQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public realm!: string;
}
