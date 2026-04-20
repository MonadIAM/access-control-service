import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { RealmLookupDTO } from "./lookup-entity.dto";

@ApiSchema({ name: "RealmLookupList" })
export class LookupListDTO extends BaseListDTO<RealmLookupDTO> {
    @Type(() => RealmLookupDTO)
    @ApiProperty({ required: true, type: [RealmLookupDTO] })
    declare public data: RealmLookupDTO[];
}
