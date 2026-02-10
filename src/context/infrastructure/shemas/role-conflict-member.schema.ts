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
        id: { primary: true, type: "uuid", defaultRaw: "gen_random_uuid()" },

        isSystemManaged: { type: "boolean", default: false, nullable: false },

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

        updatedAt: { type: "timestamptz", length: 3, nullable: true, default: null, onUpdate: () => new Date() },
        createdAt: { type: "timestamptz", length: 3, defaultRaw: "now()", nullable: false },
        lastActions: { type: "jsonb", defaultRaw: "'{}'::jsonb", nullable: false },
        isRevoked: { type: "boolean", default: false, nullable: false },
        version: { type: "int", version: true },
    },
});
