import { IsNotEmptyObject, ValidateIf } from "class-validator";
import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";
import { PaginationDTO } from "~common/dto";

import { RolesFiltersDTO } from "../utils/filters.dto";
import { RolesSortDTO } from "../utils/sort.dto";

export class GetEffectiveListRolesBodyDTO {
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
    @Type(() => RolesFiltersDTO)
    @ApiProperty({ required: true, type: RolesFiltersDTO })
    public filters!: RolesFiltersDTO;

    @Expose()
    @ValidateIf(({ sort }) => sort)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => RolesSortDTO)
    @ApiProperty({ required: true, type: RolesSortDTO })
    public sort!: RolesSortDTO;
}

export class GetEffectiveListRolesParamDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public realm!: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public account!: string;
}
