import { IsNotEmptyObject, ValidateIf } from "class-validator";
import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";
import { PaginationDTO } from "~common/dto";

import { AuditJournalsFiltersDTO } from "../utils/filters.dto";
import { AuditJournalsSortDTO } from "../utils/sort.dto";

export class GetAuditJournalsListBodyDTO {
    @Expose()
    @ValidateIf(({ pagination }) => pagination)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => PaginationDTO)
    @ApiProperty({ required: true, type: PaginationDTO })
    public pagination!: PaginationDTO;

    @Expose()
    @ValidateIf(({ filters }) => filters)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => AuditJournalsFiltersDTO)
    @ApiProperty({ required: true, type: AuditJournalsFiltersDTO })
    public filters!: AuditJournalsFiltersDTO;

    @Expose()
    @ValidateIf(({ sort }) => sort)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => AuditJournalsSortDTO)
    @ApiProperty({ required: true, type: AuditJournalsSortDTO })
    public sort!: AuditJournalsSortDTO;
}
