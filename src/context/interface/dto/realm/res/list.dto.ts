import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";
import { BaseListDTO } from "~common/dto";

import { RealmDTO } from "./entity.dto";

export class RealmPaginatedListDTO extends BaseListDTO<RealmDTO> {
    @Type(() => RealmDTO)
    @ApiProperty({ required: true, type: [RealmDTO] })
    declare public data: RealmDTO[];
}

export class RealmListDTO {
    @Expose()
    @Validator.IsArray()
    @Type(() => RealmDTO)
    @Validator.ValidateNested({ each: true })
    @ApiProperty({ required: true, type: [RealmDTO] })
    declare public data: RealmDTO[];
}
