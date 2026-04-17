import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";

import { RoleConflictGroupLookupDTO } from "../../role-conflict-group";
import { RoleLookupDTO } from "../../role";

export class RoleConflictMemberDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public id: string;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    declare public isSystemManaged: boolean;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => RoleConflictGroupLookupDTO)
    @ApiProperty({ required: true, type: RoleConflictGroupLookupDTO })
    declare public group: RoleConflictGroupLookupDTO;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => RoleLookupDTO)
    @ApiProperty({ required: true, type: RoleLookupDTO })
    declare public role: RoleLookupDTO;

    @Expose()
    @Validator.IsDate()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: Date })
    declare public updatedAt?: Date;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    declare public createdAt: Date;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    declare public isRevoked: boolean;

    @Expose()
    @Validator.IsInt()
    @ApiProperty({ required: true, type: Number })
    declare public version: number;
}
