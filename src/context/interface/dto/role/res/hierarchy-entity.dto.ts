import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

import { RoleDTO } from "./entity.dto";

export class RoleHierarchyDTO extends RoleDTO {
    @Expose()
    @Validator.IsInt()
    @ApiProperty({ required: true, type: Number })
    public depth!: number;
}
