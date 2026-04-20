import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { PermissionOverrideDTO } from "./entity.dto";

@ApiSchema({ name: "PermissionOverrideList" })
export class ListDTO extends BaseListDTO<PermissionOverrideDTO> {
    @Type(() => PermissionOverrideDTO)
    @ApiProperty({ required: true, type: [PermissionOverrideDTO] })
    declare public data: PermissionOverrideDTO[];
}
