import { IsNotEmptyObject, ValidateIf } from "class-validator";
import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { Validator } from "~common/validator";
import { PaginationDTO } from "~common/dto";
import { QueryMode } from "~context/enums";

import { ManageFiltersDTO, DefaultFiltersDTO } from "../utils/filters.dto";
import { SortDTO } from "../utils/sort.dto";

@ApiSchema({ name: "RoleEffectiveListBody" })
export class GetEffectiveListBodyDTO {
    @Expose()
    @ValidateIf(({ pagination }) => pagination)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => PaginationDTO)
    @ApiProperty({ required: false, type: PaginationDTO })
    declare public pagination: PaginationDTO;

    @Expose()
    @ValidateIf(({ filters }) => filters)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => DefaultFiltersDTO)
    @ApiProperty({ required: false, type: DefaultFiltersDTO })
    declare public filters: DefaultFiltersDTO;

    @Expose()
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => SortDTO)
    @ApiProperty({ required: true, type: SortDTO })
    declare public sort: SortDTO;
}

@ApiSchema({ name: "RoleManageEffectiveListBody" })
export class ManageGetEffectiveListBodyDTO {
    @Expose()
    @ValidateIf(({ pagination }) => pagination)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => PaginationDTO)
    @ApiProperty({ required: false, type: PaginationDTO })
    declare public pagination: PaginationDTO;

    @Expose()
    @ValidateIf(({ filters }) => filters)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => ManageFiltersDTO)
    @ApiProperty({ required: false, type: ManageFiltersDTO })
    declare public filters: ManageFiltersDTO;

    @Expose()
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => SortDTO)
    @ApiProperty({ required: true, type: SortDTO })
    declare public sort: SortDTO;
}

@ApiSchema({ name: "RoleEffectiveListQuery" })
export class GetEffectiveListQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;

    public get mode(): QueryMode.DEFAULT {
        return QueryMode.DEFAULT;
    }
}

@ApiSchema({ name: "RoleManageEffectiveListQuery" })
export class ManageGetEffectiveListQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public account: string;

    public get mode(): QueryMode.MANAGE {
        return QueryMode.MANAGE;
    }
}
