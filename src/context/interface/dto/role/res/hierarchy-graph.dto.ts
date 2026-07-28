import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { RoleArchetype } from "~context/enums";
import { Validator } from "~common/validator";

@ApiSchema({ name: "GraphNodeAttributes" })
class NodeAttributesDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ type: String })
    declare public code: string;

    @Expose()
    @Validator.IsEnum(RoleArchetype)
    @ApiProperty({ required: true, enum: RoleArchetype, enumName: "RoleArchetype" })
    declare public archetype: RoleArchetype;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ type: Boolean })
    declare public isRevoked: boolean;
}

@ApiSchema({ name: "GraphNode" })
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

@ApiSchema({ name: "GraphEdge" })
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

@ApiSchema({ name: "RoleHierarchyGraph" })
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
