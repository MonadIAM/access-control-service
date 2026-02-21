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

        isSystemManaged: { type: "boolean", nullable: false },

        group: {
            kind: "m:1",
            nullable: false,
            entity: () => RoleConflictGroup,
            fieldName: "group_id",
            deleteRule: "cascade",
        },
        role: {
            kind: "m:1",
            nullable: false,
            entity: () => Role,
            fieldName: "role_id",
            deleteRule: "cascade",
        },

        createdAt: { type: "timestamptz", length: 3, nullable: false },
        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        lastActions: { type: "jsonb", nullable: false },
        isRevoked: { type: "boolean", nullable: false },
        version: { type: "int", version: true },
    },
});
