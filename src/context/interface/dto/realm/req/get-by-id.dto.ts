import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { BaseReadQueryDTO } from "~common/dto";
import { Validator } from "~common/validator";
import { QueryMode } from "~context/enums";

@ApiSchema({ name: "RealmGetByIdQuery" })
export class GetByIdQueryDTO extends BaseReadQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;

    public get mode(): QueryMode.DEFAULT {
        return QueryMode.DEFAULT;
    }
}

@ApiSchema({ name: "RealmManageGetByIdQuery" })
export class ManageGetByIdQueryDTO extends BaseReadQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;

    public get mode(): QueryMode.MANAGE {
        return QueryMode.MANAGE;
    }
}
