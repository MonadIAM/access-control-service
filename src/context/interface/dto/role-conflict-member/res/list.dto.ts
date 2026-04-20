import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { RoleConflictMemberDTO } from "./entity.dto";

@ApiSchema({ name: "RoleConflictMemberList" })
export class ListDTO extends BaseListDTO<RoleConflictMemberDTO> {
    @Type(() => RoleConflictMemberDTO)
    @ApiProperty({ required: true, type: [RoleConflictMemberDTO] })
    declare public data: RoleConflictMemberDTO[];
}
