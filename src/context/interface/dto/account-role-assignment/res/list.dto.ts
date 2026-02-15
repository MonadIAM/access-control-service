import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { AccountRoleAssignmentDTO } from "./entity.dto";

export class AccountRoleAssignmentListDTO extends BaseListDTO<AccountRoleAssignmentDTO> {
    @Type(() => AccountRoleAssignmentDTO)
    @ApiProperty({ required: true, type: [AccountRoleAssignmentDTO] })
    declare public data: AccountRoleAssignmentDTO[];
}
