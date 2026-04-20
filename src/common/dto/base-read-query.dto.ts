import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Transform } from "class-transformer";

import { ResponseViewType } from "~context/enums";
import { Validator } from "~common/validator";

@ApiSchema({ name: "BaseReadQuery" })
export class BaseReadQueryDTO {
    @Expose()
    @Validator.IsOptional()
    @Validator.IsEnum(ResponseViewType)
    @Transform(({ value }) => value ?? ResponseViewType.COMPACT)
    @ApiProperty({ required: false, enum: ResponseViewType, enumName: "ResponseViewType" })
    public view: ResponseViewType = ResponseViewType.COMPACT;
}
