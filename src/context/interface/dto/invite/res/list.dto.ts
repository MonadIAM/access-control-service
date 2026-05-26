import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { InviteDTO } from "./entity.dto";

@ApiSchema({ name: "InviteList" })
export class ListDTO extends BaseListDTO<InviteDTO> {
    @Type(() => InviteDTO)
    @ApiProperty({ required: true, type: [InviteDTO] })
    declare public data: InviteDTO[];
}
