import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { RoleLookupDTO } from "./lookup-entity.dto";

@ApiSchema({ name: "RoleLookupList" })
export class LookupListDTO extends BaseListDTO<RoleLookupDTO> {
    @Type(() => RoleLookupDTO)
    @ApiProperty({ required: true, type: [RoleLookupDTO] })
    declare public data: RoleLookupDTO[];
}
