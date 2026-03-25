import { IsNotEmptyObject, ValidateIf } from "class-validator";
import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";
import { PaginationDTO } from "~common/dto";

import { AuditLogsFiltersDTO } from "../utils/filters.dto";
import { AuditLogsSortDTO } from "../utils/sort.dto";

export class GetAuditLogsListBodyDTO {
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
    @Type(() => AuditLogsFiltersDTO)
    @ApiProperty({ required: true, type: AuditLogsFiltersDTO })
    public filters!: AuditLogsFiltersDTO;

    @Expose()
    @ValidateIf(({ sort }) => sort)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => AuditLogsSortDTO)
    @ApiProperty({ required: true, type: AuditLogsSortDTO })
    public sort!: AuditLogsSortDTO;
}
