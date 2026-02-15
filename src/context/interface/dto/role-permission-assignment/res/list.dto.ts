import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { RolePermissionAssignmentDTO } from "./entity.dto";

export class RolePermissionAssignmentListDTO extends BaseListDTO<RolePermissionAssignmentDTO> {
    @Type(() => RolePermissionAssignmentDTO)
    @ApiProperty({ required: true, type: [RolePermissionAssignmentDTO] })
    declare public data: RolePermissionAssignmentDTO[];
}
