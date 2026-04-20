import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { PermissionLookupDTO } from "./lookup-entity.dto";

@ApiSchema({ name: "PermissionLookupList" })
export class LookupListDTO extends BaseListDTO<PermissionLookupDTO> {
    @Type(() => PermissionLookupDTO)
    @ApiProperty({ required: true, type: [PermissionLookupDTO] })
    declare public data: PermissionLookupDTO[];
}
