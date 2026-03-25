import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { AuditLogDTO } from "./entity.dto";

export class AuditLogListDTO extends BaseListDTO<AuditLogDTO> {
    @Type(() => AuditLogDTO)
    @ApiProperty({ required: true, type: [AuditLogDTO] })
    declare public data: AuditLogDTO[];
}
