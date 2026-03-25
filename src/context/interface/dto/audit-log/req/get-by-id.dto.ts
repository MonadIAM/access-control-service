import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { BaseReadQueryDTO } from "~common/dto";
import { Validator } from "~common/validator";

export class GetAuditLogByIdQueryDTO extends BaseReadQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public log!: string;
}
