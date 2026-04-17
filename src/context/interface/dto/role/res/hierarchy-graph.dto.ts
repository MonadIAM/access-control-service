import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { RoleProtoType } from "~context/enums";
import { Validator } from "~common/validator";

class NodeAttributesDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ type: String })
    declare public code: string;

    @Expose()
    @Validator.IsEnum(RoleProtoType)
    @ApiProperty({ required: true, enum: RoleProtoType, enumName: "RoleProtoType" })
    declare public protoType: RoleProtoType;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ type: Boolean })
    declare public isRevoked: boolean;
}

class NodeDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ type: String })
    declare public id: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ type: String })
    declare public label: string;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => NodeAttributesDTO)
    @ApiProperty({ type: NodeAttributesDTO })
    declare public attributes: NodeAttributesDTO;
}

class EdgeDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ type: String })
    declare public id: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ type: String, format: "uuid" })
    declare public source: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ type: String, format: "uuid" })
    declare public target: string;
}

export class RoleHierarchyGraphDTO {
    @Expose()
    @Validator.IsArray()
    @Validator.ValidateNested({ each: true })
    @Type(() => NodeDTO)
    @ApiProperty({ type: [NodeDTO] })
    declare public nodes: NodeDTO[];

    @Expose()
    @Validator.IsArray()
    @Validator.ValidateNested({ each: true })
    @Type(() => EdgeDTO)
    @ApiProperty({ type: [EdgeDTO] })
    declare public edges: EdgeDTO[];
}
