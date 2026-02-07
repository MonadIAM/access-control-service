import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { AccountRoleMatrixDTO } from "./entity.dto";

export class AccountRoleMatrixListDTO extends BaseListDTO<AccountRoleMatrixDTO> {
    @Type(() => AccountRoleMatrixDTO)
    @ApiProperty({ required: true, type: [AccountRoleMatrixDTO] })
    declare public data: AccountRoleMatrixDTO[];
}
