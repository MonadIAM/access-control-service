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
        id: { primary: true, type: "uuid", defaultRaw: "gen_random_uuid()" },

        isSystemManaged: { type: "boolean", default: false, nullable: false },
        maxAllowed: { type: "int", default: 1, nullable: false },
        code: { type: "string", length: 128, nullable: false },
        name: { type: "string", length: 255, nullable: false },
        description: { type: "text", nullable: true },

        realm: {
            ref: true,
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

        updatedAt: { type: "timestamptz", nullable: true, default: null, onUpdate: () => new Date() },
        lastActions: { type: "jsonb", defaultRaw: "'{}'::jsonb", nullable: false },
        createdAt: { type: "timestamptz", defaultRaw: "now()", nullable: false },
        isRevoked: { type: "boolean", default: false, nullable: false },
        version: { type: "int", version: true },
    },
});
