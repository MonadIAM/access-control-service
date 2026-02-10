import { QueryOrder } from "@mikro-orm/postgresql";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

export class RolesSortDTO implements Repositories.Role.Sort {
    @Expose()
    @Validator.IsOptional()
    @Validator.IsEnum(QueryOrder)
    @ApiProperty({ required: false, enum: QueryOrder, enumName: "QueryOrder" })
    public createdAt?: QueryOrder;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsEnum(QueryOrder)
    @ApiProperty({ required: false, enum: QueryOrder, enumName: "QueryOrder" })
    public updatedAt?: QueryOrder;
}
