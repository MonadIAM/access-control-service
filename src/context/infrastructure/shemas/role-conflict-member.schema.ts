import { EntitySchema } from "@mikro-orm/core";

import { Role } from "../../domain/entities/role.entity";
import { RoleConflictGroup } from "../../domain/entities/role-conflict-group.entity";
import { RoleConflictMember } from "../../domain/entities/role-conflict-member.entity";

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
        lastActions: { type: "jsonb" },
        isRevoked: { type: "boolean" },
    },
});
