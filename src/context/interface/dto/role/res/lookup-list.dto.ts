import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { LookupRoleDTO } from "./lookup-entity.dto";

export class LookupRoleListDTO extends BaseListDTO<LookupRoleDTO> {
    @Type(() => LookupRoleDTO)
    @ApiProperty({ required: true, type: [LookupRoleDTO] })
    declare public data: LookupRoleDTO[];
}
