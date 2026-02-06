import { IsNotEmptyObject, ValidateIf } from "class-validator";
import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";
import { PaginationDTO } from "~common/dto";

export class GetLookupListRolesBodyDTO {
    @Expose()
    @ValidateIf(({ pagination }) => pagination)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => PaginationDTO)
    @ApiProperty({ required: true, type: PaginationDTO })
    public pagination!: PaginationDTO;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public term!: string;
}

export class GetLookupListRolesParamDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public realm!: string;
}
