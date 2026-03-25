import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { OrdinalFilterDTO, StringFilterDTO } from "~common/dto";
import { Validator } from "~common/validator";

export class ChangeLogsFiltersDTO implements Repositories.ChangeLog.Filters {
    @Expose()
    @Validator.IsOptional()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public id?: StringFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public auditEntry?: StringFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public entity?: StringFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public changeType?: StringFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public entityType?: StringFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => OrdinalFilterDTO)
    @ApiProperty({ required: false, type: OrdinalFilterDTO })
    public createdAt?: OrdinalFilterDTO<Date>;
}
