import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";

class RealmPatchDTO {
    @Expose()
    @Validator.IsString()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: String })
    declare public name?: string;

    @Expose()
    @Validator.IsString()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: String })
    declare public description?: string;
}

export class UpdateRealmBodyDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public reason: string;

    @Expose()
    @Type(() => RealmPatchDTO)
    @Validator.ValidateNested()
    @ApiProperty({ required: true, type: RealmPatchDTO })
    declare public patch: RealmPatchDTO;
}

export class UpdateRealmQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public id: string;
}
