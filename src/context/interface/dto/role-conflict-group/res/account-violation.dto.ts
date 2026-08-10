import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";
import { Validator } from "~common/validator";

@ApiSchema({ name: "AccountViolation" })
export class AccountViolationDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public account: string;

    @Expose()
    @Validator.IsPositiveInt()
    @ApiProperty({ required: true, type: Number })
    declare public matchedCount: number;
}

@ApiSchema({ name: "AccountViolationList" })
export class ViolatingAccountsListDTO extends BaseListDTO<AccountViolationDTO> {
    @Type(() => AccountViolationDTO)
    @ApiProperty({ required: true, type: [AccountViolationDTO] })
    declare public data: AccountViolationDTO[];
}
