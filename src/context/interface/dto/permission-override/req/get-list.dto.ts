import { IsNotEmptyObject, ValidateIf } from "class-validator";
import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { BaseReadQueryDTO, PaginationDTO } from "~common/dto";
import { Validator } from "~common/validator";

import { PermissionOverridesFiltersDTO } from "../utils/filters.dto";
import { PermissionOverridesSortDTO } from "../utils/sort.dto";

export class GetPermissionOverridesListBodyDTO {
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
    @Type(() => PermissionOverridesFiltersDTO)
    @ApiProperty({ required: true, type: PermissionOverridesFiltersDTO })
    public filters!: PermissionOverridesFiltersDTO;

    @Expose()
    @ValidateIf(({ sort }) => sort)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => PermissionOverridesSortDTO)
    @ApiProperty({ required: true, type: PermissionOverridesSortDTO })
    public sort!: PermissionOverridesSortDTO;
}

export class GetPermissionOverridesListQueryDTO extends BaseReadQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public realm!: string;
}
