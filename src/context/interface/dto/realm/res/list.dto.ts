import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { RealmDTO } from "./entity.dto";

@ApiSchema({ name: "RealmList" })
export class ListDTO extends BaseListDTO<RealmDTO> {
    @Type(() => RealmDTO)
    @ApiProperty({ required: true, type: [RealmDTO] })
    declare public data: RealmDTO[];
}
