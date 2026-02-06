import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { RoleDTO } from "./entity.dto";

export class RolePaginatedListDTO extends BaseListDTO<RoleDTO> {
    @Type(() => RoleDTO)
    @ApiProperty({ required: true, type: [RoleDTO] })
    declare public data: RoleDTO[];
}
