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

        code: { type: "text" },
        name: { type: "text" },
        description: { type: "text", nullable: true },
        maxAllowed: { type: "int" },

        isSystemManaged: { type: "boolean" },
        isRevoked: { type: "boolean" },

        realm: {
            kind: "m:1",
            entity: () => Realm,
            fieldName: "realm_id",
            deleteRule: "cascade",
        },

        members: {
            kind: "1:m",
            entity: () => RoleConflictMember,
            mappedBy: "group",
        },

        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
        version: { type: "int", version: true },
    },
});
