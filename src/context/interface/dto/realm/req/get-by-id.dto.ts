import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { BaseReadQueryDTO } from "~common/dto";
import { Validator } from "~common/validator";

export class GetRealmByIdQueryDTO extends BaseReadQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;
}
