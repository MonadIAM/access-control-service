import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsNotEmptyObject } from "class-validator";
import { Expose, Type } from "class-transformer";

import { Validator } from "~common/validator";
import { PaginationDTO } from "~common/dto";
import { QueryMode } from "~context/enums";

import { ManageFiltersDTO, DefaultFiltersDTO } from "../utils/filters.dto";
import { SortDTO } from "../utils/sort.dto";

@ApiSchema({ name: "RoleDelegableByAccountListBody" })
export class GetDelegableByAccountListBodyDTO {
    @Expose()
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => PaginationDTO)
    @ApiProperty({ required: true, type: PaginationDTO })
    declare public pagination: PaginationDTO;

    @Expose()
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => DefaultFiltersDTO)
    @ApiProperty({ required: true, type: DefaultFiltersDTO })
    declare public filters: DefaultFiltersDTO;

    @Expose()
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => SortDTO)
    @ApiProperty({ required: true, type: SortDTO })
    declare public sort: SortDTO;
}

@ApiSchema({ name: "RoleManageDelegableByAccountListBody" })
export class ManageGetDelegableByAccountListBodyDTO {
    @Expose()
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => PaginationDTO)
    @ApiProperty({ required: true, type: PaginationDTO })
    declare public pagination: PaginationDTO;

    @Expose()
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => ManageFiltersDTO)
    @ApiProperty({ required: true, type: ManageFiltersDTO })
    declare public filters: ManageFiltersDTO;

    @Expose()
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => SortDTO)
    @ApiProperty({ required: true, type: SortDTO })
    declare public sort: SortDTO;
}

@ApiSchema({ name: "RoleDelegableByAccountListQuery" })
export class GetDelegableByAccountListQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;

    public get mode(): QueryMode.DEFAULT {
        return QueryMode.DEFAULT;
    }
}

@ApiSchema({ name: "RoleManageDelegableByAccountListQuery" })
export class ManageGetDelegableByAccountListQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public account: string;

    public get mode(): QueryMode.MANAGE {
        return QueryMode.MANAGE;
    }
}
