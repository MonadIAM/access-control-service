import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { RoleDTO } from "./entity.dto";

@ApiSchema({ name: "RoleList" })
export class ListDTO extends BaseListDTO<RoleDTO> {
    @Type(() => RoleDTO)
    @ApiProperty({ required: true, type: [RoleDTO] })
    declare public data: RoleDTO[];
}
