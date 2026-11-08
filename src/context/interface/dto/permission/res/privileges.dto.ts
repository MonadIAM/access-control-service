import { ApiExtraModels, ApiProperty, ApiSchema, getSchemaPath } from "@nestjs/swagger";
import { Expose, Transform } from "class-transformer";

import { PrivilegeScope } from "~context/enums";
import { Validator } from "~common/validator";

@ApiSchema({ name: "GlobalPrivilege" })
class GlobalPrivilegeDTO {
    @Expose()
    @Validator.IsEnum(PrivilegeScope)
    @ApiProperty({ required: true, enum: [PrivilegeScope.GLOBAL] })
    declare public scope: PrivilegeScope.GLOBAL;
}

@ApiSchema({ name: "RealmPrivilege" })
class RealmPrivilegeDTO {
    @Expose()
    @Validator.IsEnum(PrivilegeScope)
    @ApiProperty({ required: true, enum: [PrivilegeScope.REALM] })
    declare public scope: PrivilegeScope.REALM;

    @Expose()
    @Validator.IsUniqueArray()
    @Validator.IsUUID("4", { each: true })
    @ApiProperty({ required: true, type: [String], format: "uuid" })
    declare public realms: string[];
}

@ApiSchema({ name: "Privileges" })
@ApiExtraModels(GlobalPrivilegeDTO, RealmPrivilegeDTO)
export class PrivilegesDTO {
    @Expose()
    @Validator.IsObject()
    @Transform(({ obj }: { obj: PrivilegesDTO }) => obj.revisions)
    @ApiProperty({ type: Object, additionalProperties: { type: "object", additionalProperties: { type: "string" } } })
    declare public revisions: Record<string, Record<string, string>>;

    @Expose()
    @Validator.IsObject()
    @Transform(({ obj }: { obj: PrivilegesDTO }) => obj.globalRevision)
    @ApiProperty({ type: Object, additionalProperties: { type: "string" } })
    declare public globalRevision: Record<string, string>;

    @Expose()
    @Validator.IsObject()
    @Transform(({ obj }: { obj: PrivilegesDTO }) => obj.data)
    @ApiProperty({
        required: true,
        type: Object,
        additionalProperties: {
            type: "array",
            items: {
                oneOf: [{ $ref: getSchemaPath(GlobalPrivilegeDTO) }, { $ref: getSchemaPath(RealmPrivilegeDTO) }],
            },
        },
    })
    declare public data: Record<string, (GlobalPrivilegeDTO | RealmPrivilegeDTO)[]>;
}
