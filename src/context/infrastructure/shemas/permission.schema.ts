import { EntitySchema } from "@mikro-orm/core";

import { RolePermissionAssignment, PermissionOverride, Permission, Realm } from "~context/domain/entities";

export const PermissionSchema = new EntitySchema<Permission>({
    class: Permission,
    tableName: "permission",
    schema: "access_control",

    indexes: [
        {
            name: "permission_realm_code_unique",
            expression:
                'CREATE UNIQUE INDEX "permission_realm_code_unique" ON "access_control"."permission" ("realm_id", "code") WHERE "realm_id" IS NOT NULL',
        },
        {
            name: "permission_global_code_unique",
            expression:
                'CREATE UNIQUE INDEX "permission_global_code_unique" ON "access_control"."permission" ("code") WHERE "realm_id" IS NULL',
        },
        {
            name: "permission_name_trgm_idx",
            expression:
                'CREATE INDEX "permission_name_trgm_idx" ON "access_control"."permission" USING gin ("name" gin_trgm_ops)',
        },
    ],

    properties: {
        id: { primary: true, type: "uuid", defaultRaw: "gen_random_uuid()" },

        isSystemManaged: { type: "boolean", default: false, nullable: false },
        code: { type: "string", length: 128, nullable: false },
        name: { type: "string", length: 255, nullable: false },
        description: { type: "text", nullable: true },

        realm: {
            kind: "m:1",
            default: null,
            nullable: true,
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

        updatedAt: { type: "timestamptz", length: 3, nullable: true, default: null, onUpdate: () => new Date() },
        createdAt: { type: "timestamptz", length: 3, defaultRaw: "now()", nullable: false },
        lastActions: { type: "jsonb", defaultRaw: "'{}'::jsonb", nullable: false },
        isRevoked: { type: "boolean", default: false, nullable: false },
        version: { type: "int", version: true },
    },
});
