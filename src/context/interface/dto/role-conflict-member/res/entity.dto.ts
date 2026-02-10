import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { DeltaAuditLastActionsDTO } from "~common/dto";
import { Validator } from "~common/validator";

import { RoleConflictGroupLookupDTO } from "../../role-conflict-group";
import { RoleLookupDTO } from "../../role";

export class RoleConflictMemberDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public id!: string;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    public isSystemManaged!: boolean;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => RoleConflictGroupLookupDTO)
    @ApiProperty({ required: true, type: RoleConflictGroupLookupDTO })
    public group!: RoleConflictGroupLookupDTO;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => RoleLookupDTO)
    @ApiProperty({ required: true, type: RoleLookupDTO })
    public role!: RoleLookupDTO;

    @Expose()
    @Validator.IsDate()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: Date })
    public updatedAt?: Date;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => DeltaAuditLastActionsDTO)
    @ApiProperty({ required: true, type: DeltaAuditLastActionsDTO })
    public lastActions!: DeltaAudit.LastActionsSnapshot;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    public createdAt!: Date;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    public isRevoked!: boolean;

    @Expose()
    @Validator.IsInt()
    @ApiProperty({ required: true, type: Number })
    public version!: number;
}
