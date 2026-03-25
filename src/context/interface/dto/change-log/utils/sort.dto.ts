import { QueryOrder } from "@mikro-orm/postgresql";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

export class ChangeLogsSortDTO implements Repositories.ChangeLog.Sort {
    @Expose()
    @Validator.IsOptional()
    @Validator.IsEnum(QueryOrder)
    @ApiProperty({ required: false, enum: QueryOrder, enumName: "QueryOrder" })
    public createdAt?: QueryOrder;
}
