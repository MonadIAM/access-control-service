import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { AccountRoleAssignmentDTO } from "./entity.dto";

@ApiSchema({ name: "AccountRoleAssignmentList" })
export class ListDTO extends BaseListDTO<AccountRoleAssignmentDTO> {
    @Type(() => AccountRoleAssignmentDTO)
    @ApiProperty({ required: true, type: [AccountRoleAssignmentDTO] })
    declare public data: AccountRoleAssignmentDTO[];
}
