import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { RealmDTO } from "./entity.dto";

export class RealmListDTO extends BaseListDTO<RealmDTO> {
    @Type(() => RealmDTO)
    @ApiProperty({ required: true, type: [RealmDTO] })
    declare public data: RealmDTO[];
}
