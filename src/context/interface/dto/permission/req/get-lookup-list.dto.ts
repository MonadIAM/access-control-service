import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { IsNotEmptyObject } from "class-validator";
import { Expose, Type } from "class-transformer";

import { Validator } from "~common/validator";
import { PaginationDTO } from "~common/dto";
import { QueryMode } from "~context/enums";

@ApiSchema({ name: "PermissionLookupListBody" })
export class GetLookupListBodyDTO {
    @Expose()
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => PaginationDTO)
    @ApiProperty({ required: true, type: PaginationDTO })
    declare public pagination: PaginationDTO;
}

@ApiSchema({ name: "PermissionLookupListQuery" })
export class GetLookupListQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public term: string;

    public get mode(): QueryMode.DEFAULT {
        return QueryMode.DEFAULT;
    }
}

@ApiSchema({ name: "PermissionManageLookupListQuery" })
export class ManageGetLookupListQueryDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public term: string;

    public get mode(): QueryMode.MANAGE {
        return QueryMode.MANAGE;
    }
}
