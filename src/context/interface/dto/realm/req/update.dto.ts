import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";

class RealmPatchDTO {
    @Expose()
    @Validator.IsString()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: String })
    public name?: string;

    @Expose()
    @Validator.IsString()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: String })
    public description?: string;
}

export class UpdateRealmBodyDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public reason!: string;

    @Expose()
    @Type(() => RealmPatchDTO)
    @Validator.ValidateNested()
    @ApiProperty({ required: true, type: RealmPatchDTO })
    public patch!: RealmPatchDTO;
}

export class UpdateRealmQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public id!: string;
}
