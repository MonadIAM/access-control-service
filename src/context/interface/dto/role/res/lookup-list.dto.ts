import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { RoleLookupDTO } from "./lookup-entity.dto";

export class RoleLookupListDTO extends BaseListDTO<RoleLookupDTO> {
    @Type(() => RoleLookupDTO)
    @ApiProperty({ required: true, type: [RoleLookupDTO] })
    declare public data: RoleLookupDTO[];
}
