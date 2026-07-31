import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "RoleConflictGroupPatch" })
class PatchDTO {
    @Expose()
    @Validator.IsString()
    @Validator.MaxLength(128)
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: String })
    declare public name?: string;

    @Expose()
    @Validator.IsString()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: String })
    declare public description?: string;
}

@ApiSchema({ name: "RoleConflictGroupUpdateBody" })
export class UpdateBodyDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public reason: string;

    @Expose()
    @Type(() => PatchDTO)
    @Validator.ValidateNested()
    @ApiProperty({ required: true, type: PatchDTO })
    declare public patch: PatchDTO;
}

@ApiSchema({ name: "RoleConflictGroupUpdateQuery" })
export class UpdateQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public id: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;
}
