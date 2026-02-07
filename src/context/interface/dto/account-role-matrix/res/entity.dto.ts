import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { DeltaAuditLastActionsDTO } from "~common/dto";
import { Validator } from "~common/validator";

import { RealmDTO } from "../../realm";
import { RoleDTO } from "../../role";

export class AccountRoleMatrixDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public id!: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public accountId!: string;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    public isSystemManaged!: boolean;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    public isRevoked!: boolean;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => RoleDTO)
    @ApiProperty({ required: true, type: RoleDTO })
    public role!: RoleDTO;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => RealmDTO)
    @ApiProperty({ required: true, type: RealmDTO })
    public realm!: RealmDTO;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    public createdAt!: Date;

    @Expose()
    @Validator.IsDate()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: Date })
    public updatedAt?: Date;

    @Expose()
    @Validator.IsInt()
    @ApiProperty({ required: true, type: Number })
    public version!: number;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => DeltaAuditLastActionsDTO)
    @ApiProperty({ required: true, type: DeltaAuditLastActionsDTO })
    public lastActions!: DeltaAudit.LastActionsSnapshot;
}
