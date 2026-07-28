import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { LinkFilterDTO, OrdinalFilterDTO, StringFilterDTO } from "~common/dto";
import { Validator } from "~common/validator";

@ApiSchema({ name: "RoleFilters" })
export class DefaultFiltersDTO implements Adapters.Role.DefaultFilters {
    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public id?: StringFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public actorType?: StringFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public archetype?: StringFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsBoolean()
    @ApiProperty({ required: false, type: Boolean })
    public isSystemManaged?: boolean;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsBoolean()
    @ApiProperty({ required: false, type: Boolean })
    public nonDelegable?: boolean;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public code?: StringFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public name?: StringFilterDTO;

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

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => LinkFilterDTO)
    @ApiProperty({ required: false, type: LinkFilterDTO })
    public permission?: LinkFilterDTO;
}

@ApiSchema({ name: "RoleManageFilters" })
export class ManageFiltersDTO extends DefaultFiltersDTO implements Adapters.Role.ManageFilters {
    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => LinkFilterDTO)
    @ApiProperty({ required: false, type: LinkFilterDTO })
    public realm?: LinkFilterDTO;
}
