import { IsNotEmptyObject, ValidateIf } from "class-validator";
import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";
import { PaginationDTO } from "~common/dto";

import { AccountRoleMatricesFiltersDTO } from "../utils/filters.dto";
import { AccountRoleMatricesSortDTO } from "../utils/sort.dto";

export class GetAccountRoleMatricesListBodyDTO {
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
    @Type(() => AccountRoleMatricesFiltersDTO)
    @ApiProperty({ required: true, type: AccountRoleMatricesFiltersDTO })
    public filters!: AccountRoleMatricesFiltersDTO;

    @Expose()
    @ValidateIf(({ sort }) => sort)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => AccountRoleMatricesSortDTO)
    @ApiProperty({ required: true, type: AccountRoleMatricesSortDTO })
    public sort!: AccountRoleMatricesSortDTO;
}

export class GetAccountRoleMatricesListQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public realm!: string;
}
