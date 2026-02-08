import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { PermissionOverrideDTO } from "./entity.dto";

export class PermissionOverrideListDTO extends BaseListDTO<PermissionOverrideDTO> {
    @Type(() => PermissionOverrideDTO)
    @ApiProperty({ required: true, type: [PermissionOverrideDTO] })
    declare public data: PermissionOverrideDTO[];
}
