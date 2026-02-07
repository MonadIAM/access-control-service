import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";
import { BaseListDTO } from "~common/dto";

import { AccountRoleMatrixDTO } from "./entity.dto";

export class AccountRoleMatrixPaginatedListDTO extends BaseListDTO<AccountRoleMatrixDTO> {
    @Type(() => AccountRoleMatrixDTO)
    @ApiProperty({ required: true, type: [AccountRoleMatrixDTO] })
    declare public data: AccountRoleMatrixDTO[];
}

export class AccountRoleMatrixListDTO {
    @Expose()
    @Validator.IsArray()
    @Type(() => AccountRoleMatrixDTO)
    @Validator.ValidateNested({ each: true })
    @ApiProperty({ required: true, type: [AccountRoleMatrixDTO] })
    declare public data: AccountRoleMatrixDTO[];
}
