import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { RoleHierarchyDTO } from "./hierarchy-entity.dto";

@ApiSchema({ name: "RoleHierarchyList" })
export class HierarchyListDTO extends BaseListDTO<RoleHierarchyDTO> {
    @Type(() => RoleHierarchyDTO)
    @ApiProperty({ required: true, type: [RoleHierarchyDTO] })
    declare public data: RoleHierarchyDTO[];
}
