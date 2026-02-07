import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { PermissionLookupDTO } from "./lookup-entity.dto";

export class PermissionLookupPaginatedListDTO extends BaseListDTO<PermissionLookupDTO> {
    @Type(() => PermissionLookupDTO)
    @ApiProperty({ required: true, type: [PermissionLookupDTO] })
    declare public data: PermissionLookupDTO[];
}
