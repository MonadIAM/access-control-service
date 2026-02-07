import { EntitySchema } from "@mikro-orm/core";

import { AccountRoleMatrix, Realm, Role } from "~context/domain/entities";

export const AccountRoleMatrixSchema = new EntitySchema<AccountRoleMatrix>({
    class: AccountRoleMatrix,
    tableName: "account_role_matrix",
    schema: "access_control",

    uniques: [
        {
            name: "account_role_matrix_realm_account_role_unique",
            properties: ["realm", "accountId", "role"],
        },
    ],

    indexes: [
        {
            name: "account_role_matrix_realm_account_idx",
            properties: ["realm", "accountId"],
        },
        {
            name: "account_role_matrix_realm_role_idx",
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

        updatedAt: { type: "timestamptz", nullable: true, default: null, onUpdate: () => new Date() },
        lastActions: { type: "jsonb", defaultRaw: "'{}'::jsonb", nullable: false },
        createdAt: { type: "timestamptz", defaultRaw: "now()", nullable: false },
        isRevoked: { type: "boolean", default: false, nullable: false },
        version: { type: "int", version: true },
    },
});
