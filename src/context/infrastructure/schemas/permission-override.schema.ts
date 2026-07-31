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
            properties: ["realm", "account", "permission"],
        },
    ],

    indexes: [
        {
            name: "permission_override_account_idx",
            properties: ["account"],
        },
        {
            name: "permission_override_permission_idx",
            properties: ["permission"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        account: { type: "uuid", fieldName: "account" },
        effect: { enum: true, items: () => PermissionOverrideEffect, nativeEnumName: "permission_override_effect" },

        isRevoked: { type: "boolean" },

        permission: {
            kind: "m:1",
            entity: () => Permission,
            fieldName: "permission_id",
            deleteRule: "cascade",
        },
        realm: {
            kind: "m:1",
            entity: () => Realm,
            fieldName: "realm_id",
            deleteRule: "cascade",
        },

        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
        version: { type: "int", version: true },
    },
});
