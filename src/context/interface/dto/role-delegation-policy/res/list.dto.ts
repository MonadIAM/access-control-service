import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { RoleDelegationPolicyDTO } from "./entity.dto";

@ApiSchema({ name: "RoleDelegationPolicyList" })
export class ListDTO extends BaseListDTO<RoleDelegationPolicyDTO> {
    @Type(() => RoleDelegationPolicyDTO)
    @ApiProperty({ required: true, type: [RoleDelegationPolicyDTO] })
    declare public data: RoleDelegationPolicyDTO[];
}
