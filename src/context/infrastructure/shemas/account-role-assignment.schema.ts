import { EntitySchema } from "@mikro-orm/core";

import { AccountRoleAssignment, Realm, Role } from "~context/domain/entities";

export const AccountRoleAssignmentSchema = new EntitySchema<AccountRoleAssignment>({
    class: AccountRoleAssignment,
    tableName: "account_role_assignment",
    schema: "access_control",

    uniques: [
        {
            name: "account_role_assignment_realm_account_role_unique",
            properties: ["realm", "accountId", "role"],
        },
    ],

    indexes: [
        {
            name: "account_role_assignment_realm_account_idx",
            properties: ["realm", "accountId"],
        },
        {
            name: "account_role_assignment_realm_role_idx",
            properties: ["realm", "role"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid", defaultRaw: "gen_random_uuid()" },

        accountId: { type: "uuid", fieldName: "account_id", nullable: false },

        isSystemManaged: { type: "boolean", default: false, nullable: false },

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

        updatedAt: { type: "timestamptz", length: 3, nullable: true, default: null, onUpdate: () => new Date() },
        createdAt: { type: "timestamptz", length: 3, defaultRaw: "now()", nullable: false },
        lastActions: { type: "jsonb", defaultRaw: "'{}'::jsonb", nullable: false },
        isRevoked: { type: "boolean", default: false, nullable: false },
        version: { type: "int", version: true },
    },
});
