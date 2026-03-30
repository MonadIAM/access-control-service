import { IsNotEmptyObject, ValidateIf } from "class-validator";
import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";
import { PaginationDTO } from "~common/dto";

import { PermissionsFiltersDTO } from "../utils/filters.dto";
import { PermissionsSortDTO } from "../utils/sort.dto";

export class GetEffectivePermissionsListBodyDTO {
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
    @Type(() => PermissionsFiltersDTO)
    @ApiProperty({ required: true, type: PermissionsFiltersDTO })
    public filters!: PermissionsFiltersDTO;

    @Expose()
    @ValidateIf(({ sort }) => sort)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => PermissionsSortDTO)
    @ApiProperty({ required: true, type: PermissionsSortDTO })
    public sort!: PermissionsSortDTO;
}

export class GetEffectivePermissionsListQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public realm!: string;

    @Expose()
    @Validator.IsUUID()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: String, format: "uuid" })
    public account?: string;
}
