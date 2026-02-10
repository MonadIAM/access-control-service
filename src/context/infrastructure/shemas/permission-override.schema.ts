import { EntitySchema } from "@mikro-orm/core";

import { PermissionOverride, Permission, Realm } from "~context/domain/entities";
import { PermissionOverrideEffect } from "~context/enums";

export const PermissionOverrideSchema = new EntitySchema<PermissionOverride>({
    class: PermissionOverride,
    tableName: "permission_override",
    schema: "access_control",

    uniques: [
        {
            name: "permission_override_realm_account_permission_unique",
            properties: ["realm", "accountId", "permission"],
        },
    ],

    indexes: [
        {
            name: "permission_override_realm_account_idx",
            properties: ["realm", "accountId"],
        },
        {
            name: "permission_override_realm_permission_idx",
            properties: ["realm", "permission"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid", defaultRaw: "gen_random_uuid()" },

        accountId: { type: "uuid", fieldName: "account_id", nullable: false },

        effect: { enum: true, items: () => PermissionOverrideEffect, nullable: false },

        permission: {
            kind: "m:1",
            nullable: false,
            entity: () => Permission,
            fieldName: "permission_id",
            deleteRule: "cascade",
        },
        realm: {
            kind: "m:1",
            nullable: false,
            entity: () => Realm,
            fieldName: "realm_id",
            deleteRule: "cascade",
        },

        updatedAt: { type: "timestamptz", length: 3, nullable: true, default: null, onUpdate: () => new Date() },
        createdAt: { type: "timestamptz", length: 3, defaultRaw: "now()", nullable: false },
        lastActions: { type: "jsonb", defaultRaw: "'{}'::jsonb", nullable: false },
        isRevoked: { type: "boolean", default: false, nullable: false },
        version: { type: "int", version: true },
    },
});
