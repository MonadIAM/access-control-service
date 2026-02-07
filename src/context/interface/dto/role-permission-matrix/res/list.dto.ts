import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { RolePermissionMatrixDTO } from "./entity.dto";

export class RolePermissionMatrixListDTO extends BaseListDTO<RolePermissionMatrixDTO> {
    @Type(() => RolePermissionMatrixDTO)
    @ApiProperty({ required: true, type: [RolePermissionMatrixDTO] })
    declare public data: RolePermissionMatrixDTO[];
}
