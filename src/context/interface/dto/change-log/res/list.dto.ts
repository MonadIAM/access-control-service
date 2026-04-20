import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { ChangeLogDTO } from "./entity.dto";

@ApiSchema({ name: "ChangeLogList" })
export class ListDTO extends BaseListDTO<ChangeLogDTO> {
    @Type(() => ChangeLogDTO)
    @ApiProperty({ required: true, type: [ChangeLogDTO] })
    declare public data: ChangeLogDTO[];
}
