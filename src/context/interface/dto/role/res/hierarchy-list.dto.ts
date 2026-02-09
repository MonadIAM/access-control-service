import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { RoleHierarchyDTO } from "./hierarchy-entity.dto";

export class RoleHierarchyListDTO extends BaseListDTO<RoleHierarchyDTO> {
    @Type(() => RoleHierarchyDTO)
    @ApiProperty({ required: true, type: [RoleHierarchyDTO] })
    declare public data: RoleHierarchyDTO[];
}
