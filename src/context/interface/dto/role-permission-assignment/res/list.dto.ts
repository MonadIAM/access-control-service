import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { RolePermissionAssignmentDTO } from "./entity.dto";

@ApiSchema({ name: "RolePermissionAssignmentList" })
export class ListDTO extends BaseListDTO<RolePermissionAssignmentDTO> {
    @Type(() => RolePermissionAssignmentDTO)
    @ApiProperty({ required: true, type: [RolePermissionAssignmentDTO] })
    declare public data: RolePermissionAssignmentDTO[];
}
