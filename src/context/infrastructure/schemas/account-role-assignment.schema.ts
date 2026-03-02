import { EntitySchema } from "@mikro-orm/core";

import { AccountRoleAssignment, Realm, Role } from "~context/domain/entities";

export const AccountRoleAssignmentSchema = new EntitySchema<AccountRoleAssignment>({
    class: AccountRoleAssignment,
    tableName: "account_role_assignment",
    schema: "access_control",

    uniques: [
        {
            name: "account_role_assignment_realm_account_role_unique",
            properties: ["realm", "account", "role"],
        },
    ],

    indexes: [
        {
            name: "account_role_assignment_account_idx",
            properties: ["account"],
        },
        {
            name: "account_role_assignment_role_idx",
            properties: ["role"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        account: { type: "uuid", fieldName: "account" },

        isSystemManaged: { type: "boolean" },

        role: {
            kind: "m:1",
            entity: () => Role,
            fieldName: "role_id",
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
        lastActions: { type: "jsonb" },
        isRevoked: { type: "boolean" },
    },
});
