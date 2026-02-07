import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";
import { BaseListDTO } from "~common/dto";

import { RolePermissionMatrixDTO } from "./entity.dto";

export class RolePermissionMatrixPaginatedListDTO extends BaseListDTO<RolePermissionMatrixDTO> {
    @Type(() => RolePermissionMatrixDTO)
    @ApiProperty({ required: true, type: [RolePermissionMatrixDTO] })
    declare public data: RolePermissionMatrixDTO[];
}

export class RolePermissionMatrixListDTO {
    @Expose()
    @Validator.IsArray()
    @Type(() => RolePermissionMatrixDTO)
    @Validator.ValidateNested({ each: true })
    @ApiProperty({ required: true, type: [RolePermissionMatrixDTO] })
    declare public data: RolePermissionMatrixDTO[];
}
