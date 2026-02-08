import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { RoleDelegationPolicyDTO } from "./entity.dto";

export class RoleDelegationPolicyListDTO extends BaseListDTO<RoleDelegationPolicyDTO> {
    @Type(() => RoleDelegationPolicyDTO)
    @ApiProperty({ required: true, type: [RoleDelegationPolicyDTO] })
    declare public data: RoleDelegationPolicyDTO[];
}
