import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";
import { BaseListDTO } from "~common/dto";

import { LookupRoleDTO, RoleDTO } from "./entity.dto";

export class LookupRolePaginatedListDTO extends BaseListDTO<LookupRoleDTO> {
    @Type(() => LookupRoleDTO)
    @ApiProperty({ required: true, type: [LookupRoleDTO] })
    declare public data: LookupRoleDTO[];
}

export class RolePaginatedListDTO extends BaseListDTO<RoleDTO> {
    @Type(() => RoleDTO)
    @ApiProperty({ required: true, type: [RoleDTO] })
    declare public data: RoleDTO[];
}

export class RoleListDTO {
    @Expose()
    @Validator.IsArray()
    @Type(() => RoleDTO)
    @Validator.ValidateNested({ each: true })
    @ApiProperty({ required: true, type: [RoleDTO] })
    declare public data: RoleDTO[];
}
