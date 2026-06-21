import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { OrdinalFilterDTO, StringFilterDTO, LinkFilterDTO } from "~common/dto";
import { Validator } from "~common/validator";

@ApiSchema({ name: "AccountRoleAssignmentFilters" })
export class DefaultFiltersDTO implements Adapters.AccountRoleAssignment.DefaultFilters {
    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public id?: StringFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => LinkFilterDTO)
    @ApiProperty({ required: false, type: LinkFilterDTO })
    public account?: LinkFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsBoolean()
    @ApiProperty({ required: false, type: Boolean })
    public isSystemManaged?: boolean;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => LinkFilterDTO)
    @ApiProperty({ required: false, type: LinkFilterDTO })
    public role?: LinkFilterDTO;

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

@ApiSchema({ name: "AccountRoleAssignmentManageFilters" })
export class ManageFiltersDTO extends DefaultFiltersDTO implements Adapters.AccountRoleAssignment.ManageFilters {
    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => LinkFilterDTO)
    @ApiProperty({ required: false, type: LinkFilterDTO })
    public realm?: LinkFilterDTO;
}
