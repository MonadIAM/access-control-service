import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";
import { BaseListDTO } from "~common/dto";

import { PermissionDTO } from "./entity.dto";

export class PermissionPaginatedListDTO extends BaseListDTO<PermissionDTO> {
    @Type(() => PermissionDTO)
    @ApiProperty({ required: true, type: [PermissionDTO] })
    declare public data: PermissionDTO[];
}

export class PermissionListDTO {
    @Expose()
    @Validator.IsArray()
    @Type(() => PermissionDTO)
    @Validator.ValidateNested({ each: true })
    @ApiProperty({ required: true, type: [PermissionDTO] })
    declare public data: PermissionDTO[];
}
