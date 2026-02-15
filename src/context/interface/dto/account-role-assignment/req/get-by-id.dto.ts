import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { BaseReadQueryDTO } from "~common/dto";
import { Validator } from "~common/validator";

export class GetAccountRoleAssignmentByIdQueryDTO extends BaseReadQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public realm!: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public assignment!: string;
}
