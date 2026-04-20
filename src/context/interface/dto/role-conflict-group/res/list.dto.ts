import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { RoleConflictGroupDTO } from "./entity.dto";

@ApiSchema({ name: "RoleConflictGroupList" })
export class ListDTO extends BaseListDTO<RoleConflictGroupDTO> {
    @Type(() => RoleConflictGroupDTO)
    @ApiProperty({ required: true, type: [RoleConflictGroupDTO] })
    declare public data: RoleConflictGroupDTO[];
}
