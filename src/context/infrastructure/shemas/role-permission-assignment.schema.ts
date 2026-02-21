import { EntitySchema } from "@mikro-orm/core";

import { RolePermissionAssignment, Permission, Role, Realm } from "~context/domain/entities";

export const RolePermissionAssignmentSchema = new EntitySchema<RolePermissionAssignment>({
    class: RolePermissionAssignment,
    tableName: "role_permission_assignment",
    schema: "access_control",

    uniques: [
        {
            name: "role_permission_assignment_role_permission_unique",
            properties: ["role", "permission"],
        },
    ],

    indexes: [
        {
            name: "role_permission_assignment_realm_permission_idx",
            properties: ["realm", "permission"],
        },
        {
            name: "role_permission_assignment_realm_role_idx",
            properties: ["realm", "role"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        isSystemManaged: { type: "boolean", nullable: false },

        role: {
            kind: "m:1",
            nullable: false,
            entity: () => Role,
            fieldName: "role_id",
            deleteRule: "cascade",
        },
        realm: {
            kind: "m:1",
            nullable: false,
            entity: () => Realm,
            fieldName: "realm_id",
            deleteRule: "cascade",
        },
        permission: {
            kind: "m:1",
            nullable: false,
            entity: () => Permission,
            fieldName: "permission_id",
            deleteRule: "cascade",
        },

        createdAt: { type: "timestamptz", length: 3, nullable: false },
        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        lastActions: { type: "jsonb", nullable: false },
        isRevoked: { type: "boolean", nullable: false },
        version: { type: "int", version: true },
    },
});
