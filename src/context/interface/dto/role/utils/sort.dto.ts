import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { QueryOrder } from "@mikro-orm/postgresql";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "RoleSort" })
export class SortDTO implements Adapters.Role.Sort {
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
