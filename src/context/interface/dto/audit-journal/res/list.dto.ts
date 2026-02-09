import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { AuditJournalDTO } from "./entity.dto";

export class AuditJournalListDTO extends BaseListDTO<AuditJournalDTO> {
    @Type(() => AuditJournalDTO)
    @ApiProperty({ required: true, type: [AuditJournalDTO] })
    declare public data: AuditJournalDTO[];
}
