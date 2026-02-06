// import { Expose, Type } from "class-transformer";
// import { ApiProperty } from "@nestjs/swagger";

// import { DeltaAuditBaseActionDTO, DeltaAuditUpdateActionDTO } from "~common/dto";
// import { Validator } from "~common/validator";

// export class DeltaAuditLastActionsDTO {
//     @Expose()
//     @Validator.ValidateNested()
//     @Type(() => DeltaAuditBaseActionDTO)
//     @ApiProperty({ required: true, type: DeltaAuditBaseActionDTO })
//     public create!: DeltaAuditBaseActionDTO;

//     @Expose()
//     @Validator.IsOptional()
//     @Validator.ValidateNested()
//     @Type(() => DeltaAuditUpdateActionDTO)
//     @ApiProperty({ required: false, type: DeltaAuditUpdateActionDTO })
//     public update?: DeltaAuditUpdateActionDTO;

//     @Expose()
//     @Validator.IsOptional()
//     @Validator.ValidateNested()
//     @Type(() => DeltaAuditBaseActionDTO)
//     @ApiProperty({ required: false, type: DeltaAuditBaseActionDTO })
//     public revoke?: DeltaAuditBaseActionDTO;

//     @Expose()
//     @Validator.IsOptional()
//     @Validator.ValidateNested()
//     @Type(() => DeltaAuditBaseActionDTO)
//     @ApiProperty({ required: false, type: DeltaAuditBaseActionDTO })
//     public restore?: DeltaAuditBaseActionDTO;
// }
