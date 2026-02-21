import { EntitySchema } from "@mikro-orm/core";

import { RoleConflictMember, RoleConflictGroup, Realm } from "~context/domain/entities";

export const RoleConflictGroupSchema = new EntitySchema<RoleConflictGroup>({
    class: RoleConflictGroup,
    tableName: "role_conflict_group",
    schema: "access_control",

    uniques: [
        {
            name: "role_conflict_group_realm_code_unique",
            properties: ["realm", "code"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        isSystemManaged: { type: "boolean", nullable: false },
        code: { type: "string", length: 128, nullable: false },
        name: { type: "string", length: 255, nullable: false },
        description: { type: "text", nullable: true },
        maxAllowed: { type: "int", nullable: false },

        realm: {
            kind: "m:1",
            nullable: false,
            entity: () => Realm,
            fieldName: "realm_id",
            deleteRule: "cascade",
        },

        members: {
            kind: "1:m",
            entity: () => RoleConflictMember,
            mappedBy: "group",
        },

        createdAt: { type: "timestamptz", length: 3, nullable: false },
        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        lastActions: { type: "jsonb", nullable: false },
        isRevoked: { type: "boolean", nullable: false },
        version: { type: "int", version: true },
    },
});
