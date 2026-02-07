import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { RealmLookupDTO } from "./lookup-entity.dto";

export class RealmLookupListDTO extends BaseListDTO<RealmLookupDTO> {
    @Type(() => RealmLookupDTO)
    @ApiProperty({ required: true, type: [RealmLookupDTO] })
    declare public data: RealmLookupDTO[];
}
