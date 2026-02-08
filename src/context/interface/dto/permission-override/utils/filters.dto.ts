import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { OrdinalFilterDTO, LinkFilterDTO } from "~common/dto";
import { Validator } from "~common/validator";

export class PermissionOverridesFiltersDTO {
    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => LinkFilterDTO)
    @ApiProperty({ required: false, type: LinkFilterDTO })
    public role?: LinkFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => LinkFilterDTO)
    @ApiProperty({ required: false, type: LinkFilterDTO })
    public realm?: LinkFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => LinkFilterDTO)
    @ApiProperty({ required: false, type: LinkFilterDTO })
    public permission?: LinkFilterDTO;

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
    public isSystemManaged?: boolean;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsBoolean()
    @ApiProperty({ required: false, type: Boolean })
    public isRevoked?: boolean;
}
