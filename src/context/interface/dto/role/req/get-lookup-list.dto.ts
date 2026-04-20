import { IsNotEmptyObject } from "class-validator";
import { Expose, Type } from "class-transformer";
import { ApiProperty, ApiSchema } from "@nestjs/swagger";

import { PaginationDTO } from "~common/dto";
import { Validator } from "~common/validator";

@ApiSchema({ name: "RoleLookupListBody" })
export class GetLookupListBodyDTO {
    @Expose()
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => PaginationDTO)
    @ApiProperty({ required: true, type: PaginationDTO })
    declare public pagination: PaginationDTO;
}

@ApiSchema({ name: "RoleLookupListQuery" })
export class GetLookupListQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public term: string;
}
