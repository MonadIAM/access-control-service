import { EntitySchema } from "@mikro-orm/core";

import { RolePermissionAssignment, PermissionOverride, Permission, Realm } from "~context/domain/entities";

export const PermissionSchema = new EntitySchema<Permission>({
    class: Permission,
    tableName: "permission",
    schema: "access_control",

    uniques: [
        {
            name: "permission_realm_code_unique",
            properties: ["realm", "code"],
        },
    ],

    indexes: [
        {
            name: "permission_name_trgm_idx",
            expression:
                'CREATE INDEX "permission_name_trgm_idx" ON "access_control"."permission" USING gin ("name" gin_trgm_ops)',
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        code: { type: "string", length: 128 },
        name: { type: "string", length: 255 },
        description: { type: "text", nullable: true },
        isSystemManaged: { type: "boolean" },

        realm: {
            kind: "m:1",
            entity: () => Realm,
            fieldName: "realm_id",
            deleteRule: "cascade",
        },

        accountOverrides: {
            kind: "1:m",
            entity: () => PermissionOverride,
            mappedBy: "permission",
        },
        roleAssignments: {
            kind: "1:m",
            entity: () => RolePermissionAssignment,
            mappedBy: "permission",
        },

        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
        version: { type: "int", version: true },
        lastActions: { type: "jsonb" },
        isRevoked: { type: "boolean" },
    },
});
