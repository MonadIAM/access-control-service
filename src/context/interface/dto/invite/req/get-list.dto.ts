import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsNotEmptyObject } from "class-validator";
import { Expose, Type } from "class-transformer";

import { BaseReadQueryDTO, PaginationDTO } from "~common/dto";
import { InviteQueryScope } from "~context/enums";
import { Validator } from "~common/validator";

import { FiltersDTO } from "../utils/filters.dto";
import { SortDTO } from "../utils/sort.dto";

@ApiSchema({ name: "InviteListBody" })
export class GetListBodyDTO {
    @Expose()
    @Validator.IsEnum(InviteQueryScope)
    @ApiProperty({ required: true, enum: InviteQueryScope, enumName: "InviteQueryScope" })
    declare public scope: InviteQueryScope;

    @Expose()
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => PaginationDTO)
    @ApiProperty({ required: false, type: PaginationDTO })
    declare public pagination: PaginationDTO;

    @Expose()
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => FiltersDTO)
    @ApiProperty({ required: false, type: FiltersDTO })
    declare public filters: FiltersDTO;

    @Expose()
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => SortDTO)
    @ApiProperty({ required: false, type: SortDTO })
    declare public sort: SortDTO;
}

@ApiSchema({ name: "InviteListQuery" })
export class GetListQueryDTO extends BaseReadQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;
}
