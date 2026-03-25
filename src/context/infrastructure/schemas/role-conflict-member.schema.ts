import { EntitySchema } from "@mikro-orm/core";

import { RoleConflictMember, RoleConflictGroup, Role } from "~context/domain/entities";

export const RoleConflictMemberSchema = new EntitySchema<RoleConflictMember>({
    class: RoleConflictMember,
    tableName: "role_conflict_member",
    schema: "access_control",

    uniques: [
        {
            name: "role_conflict_member_group_role_unique",
            properties: ["group", "role"],
        },
    ],

    indexes: [
        {
            name: "role_conflict_member_role_idx",
            properties: ["role"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        isSystemManaged: { type: "boolean" },
        isRevoked: { type: "boolean" },

        group: {
            kind: "m:1",
            entity: () => RoleConflictGroup,
            fieldName: "group_id",
            deleteRule: "cascade",
        },
        role: {
            kind: "m:1",
            entity: () => Role,
            fieldName: "role_id",
            deleteRule: "cascade",
        },

        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
        version: { type: "int", version: true },
    },
});
