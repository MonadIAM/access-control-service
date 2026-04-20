import { IsNotEmptyObject } from "class-validator";
import { Expose, Type } from "class-transformer";
import { ApiProperty, ApiSchema } from "@nestjs/swagger";

import { PaginationDTO } from "~common/dto";
import { Validator } from "~common/validator";

@ApiSchema({ name: "RealmLookupListBody" })
export class GetLookupListBodyDTO {
    @Expose()
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => PaginationDTO)
    @ApiProperty({ required: true, type: PaginationDTO })
    declare public pagination: PaginationDTO;
}

@ApiSchema({ name: "RealmLookupListQuery" })
export class GetLookupListQueryDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public term: string;
}
