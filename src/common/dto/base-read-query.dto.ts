import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { ResponseViewType } from "~context/enums";
import { Validator } from "~common/validator";

export class BaseReadQueryDTO {
    @Expose()
    @Validator.IsOptional()
    @Validator.IsEnum(ResponseViewType)
    @ApiProperty({ required: true, enum: ResponseViewType, enumName: "ResponseViewType" })
    public view: ResponseViewType = ResponseViewType.COMPACT;
}
