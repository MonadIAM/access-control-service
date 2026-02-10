import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { OrdinalFilterDTO, StringFilterDTO, LinkFilterDTO } from "~common/dto";
import { Validator } from "~common/validator";

export class RoleConflictGroupsFiltersDTO implements Repositories.RoleConflictGroup.Filters {
    @Expose()
    @Validator.IsOptional()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public id?: StringFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsBoolean()
    @ApiProperty({ required: false, type: Boolean })
    public isSystemManaged?: boolean;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => OrdinalFilterDTO)
    @ApiProperty({ required: false, type: OrdinalFilterDTO })
    public maxAllowed?: OrdinalFilterDTO<number>;

    @Expose()
    @Validator.IsOptional()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public code?: StringFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public name?: StringFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => LinkFilterDTO)
    @ApiProperty({ required: false, type: LinkFilterDTO })
    public realm?: LinkFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => OrdinalFilterDTO)
    @ApiProperty({ required: false, type: OrdinalFilterDTO })
    public updatedAt?: OrdinalFilterDTO<Date>;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => OrdinalFilterDTO)
    @ApiProperty({ required: false, type: OrdinalFilterDTO })
    public createdAt?: OrdinalFilterDTO<Date>;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsBoolean()
    @ApiProperty({ required: false, type: Boolean })
    public isRevoked?: boolean;
}
