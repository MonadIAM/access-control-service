import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { DeltaAuditLastActionsDTO } from "~common/dto";
import { Validator } from "~common/validator";

import { RealmLookupDTO } from "../../realm";
import { RoleLookupDTO } from "../../role";

export class RoleDelegationPolicyDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public id!: string;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    public isSystemManaged!: boolean;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    public isRevoked!: boolean;

    @Expose()
    @Validator.IsPositiveInt()
    @ApiProperty({ required: true, type: Number })
    public depthLimit!: number;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => RoleLookupDTO)
    @ApiProperty({ required: true, type: RoleLookupDTO })
    public delegator!: RoleLookupDTO;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => RoleLookupDTO)
    @ApiProperty({ required: true, type: RoleLookupDTO })
    public target!: RoleLookupDTO;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => RealmLookupDTO)
    @ApiProperty({ required: true, type: RealmLookupDTO })
    public realm!: RealmLookupDTO;

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
