import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { ChangeLogDTO } from "./entity.dto";

export class ChangeLogListDTO extends BaseListDTO<ChangeLogDTO> {
    @Type(() => ChangeLogDTO)
    @ApiProperty({ required: true, type: [ChangeLogDTO] })
    declare public data: ChangeLogDTO[];
}
