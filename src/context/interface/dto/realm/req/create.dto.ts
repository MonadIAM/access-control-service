import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

export class CreateRealmBodyDTO {
    @Expose()
    @Validator.IsString()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: String })
    public description?: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public code!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public name!: string;
}
