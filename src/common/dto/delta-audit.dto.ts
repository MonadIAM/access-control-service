import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";

class DeltaAuditActorDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public id!: string;
}

class DeltaAuditBaseActionDTO {
    @Expose()
    @Type(() => Date)
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    public at!: Date;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => DeltaAuditActorDTO)
    @ApiProperty({ required: true, type: DeltaAuditActorDTO })
    public by!: DeltaAuditActorDTO;

    @Expose()
    @Validator.IsString()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: String })
    public reason?: string;
}

class DeltaAuditFieldPatchDTO {
    @Expose()
    @ApiProperty({ nullable: true })
    public old!: unknown;

    @Expose()
    @ApiProperty({ nullable: true })
    public new!: unknown;
}

class DeltaAuditPatchDTO {
    @Expose()
    @Validator.IsObject()
    @Validator.ValidateNested({ each: true })
    @Type(() => DeltaAuditFieldPatchDTO)
    @ApiProperty({
        type: Object,
        required: true,
        additionalProperties: { $ref: "#/components/schemas/DeltaAuditFieldPatchDTO" },
    })
    public fields!: Record<string, DeltaAuditFieldPatchDTO>;
}

class DeltaAuditUpdateActionDTO extends DeltaAuditBaseActionDTO {
    @Expose()
    @Validator.ValidateNested()
    @Type(() => DeltaAuditPatchDTO)
    @ApiProperty({ required: true, type: DeltaAuditPatchDTO })
    public patch!: DeltaAuditPatchDTO;
}

export class DeltaAuditLastActionsDTO {
    @Expose()
    @Validator.ValidateNested()
    @Type(() => DeltaAuditBaseActionDTO)
    @ApiProperty({ required: true, type: DeltaAuditBaseActionDTO })
    public create!: DeltaAuditBaseActionDTO;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => DeltaAuditUpdateActionDTO)
    @ApiProperty({ required: false, type: DeltaAuditUpdateActionDTO })
    public update?: DeltaAuditUpdateActionDTO;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => DeltaAuditBaseActionDTO)
    @ApiProperty({ required: false, type: DeltaAuditBaseActionDTO })
    public revoke?: DeltaAuditBaseActionDTO;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => DeltaAuditBaseActionDTO)
    @ApiProperty({ required: false, type: DeltaAuditBaseActionDTO })
    public restore?: DeltaAuditBaseActionDTO;
}
