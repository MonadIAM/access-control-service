import { Expose, Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { ResponseViewType } from "~context/enums";
import { Validator } from "~common/validator";

export class BaseReadQueryDTO {
    @Expose()
    @Validator.IsOptional()
    @Validator.IsEnum(ResponseViewType)
    @Transform(({ value }) => value ?? ResponseViewType.COMPACT)
    @ApiProperty({ required: true, enum: ResponseViewType, enumName: "ResponseViewType" })
    public view: ResponseViewType = ResponseViewType.COMPACT;
}
