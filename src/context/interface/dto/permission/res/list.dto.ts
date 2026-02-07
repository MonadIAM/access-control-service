import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { PermissionDTO } from "./entity.dto";

export class PermissionListDTO extends BaseListDTO<PermissionDTO> {
    @Type(() => PermissionDTO)
    @ApiProperty({ required: true, type: [PermissionDTO] })
    declare public data: PermissionDTO[];
}
