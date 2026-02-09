import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { Validator } from "~common/validator";
import { BaseListDTO } from "~common/dto";

import { RoleConflictGroupDTO } from "./entity.dto";

export class RoleConflictGroupPaginatedListDTO extends BaseListDTO<RoleConflictGroupDTO> {
    @Type(() => RoleConflictGroupDTO)
    @ApiProperty({ required: true, type: [RoleConflictGroupDTO] })
    declare public data: RoleConflictGroupDTO[];
}

export class RoleConflictGroupListDTO {
    @Expose()
    @Validator.IsArray()
    @Validator.ValidateNested({ each: true })
    @Type(() => RoleConflictGroupDTO)
    @ApiProperty({ required: true, type: [RoleConflictGroupDTO] })
    declare public data: RoleConflictGroupDTO[];
}
