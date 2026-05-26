import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { InviteStatus } from "~context/enums";
import { Validator } from "~common/validator";

@ApiSchema({ name: "InviteChangeStatusBody" })
export class ChangeStatusBodyDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public invite: string;

    @Expose()
    @Validator.IsEnum(InviteStatus)
    @ApiProperty({ required: true, enum: InviteStatus, enumName: "InviteStatus" })
    declare public status: Exclude<InviteStatus, InviteStatus.PENDING>;
}

@ApiSchema({ name: "InviteChangeStatusQuery" })
export class ChangeStatusQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;
}
