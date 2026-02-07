import { EntitySchema } from "@mikro-orm/core";

import { RolePermissionMatrix, Permission, Role, Realm } from "~context/domain/entities";

export const RolePermissionMatrixSchema = new EntitySchema<RolePermissionMatrix>({
    class: RolePermissionMatrix,
    tableName: "role_permission_matrix",
    schema: "access_control",

    uniques: [
        {
            name: "role_permission_matrix_role_permission_unique",
            properties: ["role", "permission"],
        },
    ],

    indexes: [
        {
            name: "role_permission_matrix_realm_permission_idx",
            properties: ["realm", "permission"],
        },
        {
            name: "role_permission_matrix_realm_role_idx",
            properties: ["realm", "role"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid", defaultRaw: "gen_random_uuid()" },

        isSystemManaged: { type: "boolean", default: false, nullable: false },

        role: {
            ref: true,
            kind: "m:1",
            nullable: false,
            entity: () => Role,
            fieldName: "role_id",
            deleteRule: "cascade",
        },
        realm: {
            ref: true,
            kind: "m:1",
            nullable: false,
            entity: () => Realm,
            fieldName: "realm_id",
            deleteRule: "cascade",
        },
        permission: {
            ref: true,
            kind: "m:1",
            nullable: false,
            entity: () => Permission,
            fieldName: "permission_id",
            deleteRule: "cascade",
        },

        updatedAt: { type: "timestamptz", nullable: true, default: null, onUpdate: () => new Date() },
        lastActions: { type: "jsonb", defaultRaw: "'{}'::jsonb", nullable: false },
        createdAt: { type: "timestamptz", defaultRaw: "now()", nullable: false },
        isRevoked: { type: "boolean", default: false, nullable: false },
        version: { type: "int", version: true },
    },
});
