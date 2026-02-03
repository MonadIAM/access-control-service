import { EntitySchema } from "@mikro-orm/core";

import { RoleDelegationPolicy, Realm, Role } from "~context/domain/entities";

export const RoleDelegationPolicySchema = new EntitySchema<RoleDelegationPolicy>({
    class: RoleDelegationPolicy,
    tableName: "role_delegation_policy",
    schema: "access_control",

    uniques: [
        {
            name: "role_delegation_policy_realm_delegator_target_unique",
            properties: ["realm", "delegator", "target"],
        },
    ],

    indexes: [
        {
            name: "role_delegation_policy_realm_delegator_idx",
            properties: ["realm", "delegator"],
        },
        {
            name: "role_delegation_policy_realm_target_idx",
            properties: ["realm", "target"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid", defaultRaw: "gen_random_uuid()" },

        isSystemManaged: { type: "boolean", default: false, nullable: false },
        depthLimit: { type: "smallint", default: 0, nullable: false },
        description: { type: "text", nullable: true },

        realm: {
            ref: true,
            kind: "m:1",
            nullable: false,
            entity: () => Realm,
            fieldName: "realm_id",
            deleteRule: "cascade",
        },
        delegator: {
            ref: true,
            kind: "m:1",
            nullable: false,
            entity: () => Role,
            fieldName: "delegator_id",
            deleteRule: "cascade",
        },
        target: {
            ref: true,
            kind: "m:1",
            nullable: false,
            entity: () => Role,
            fieldName: "target_id",
            deleteRule: "cascade",
        },

        updatedAt: { type: "timestamptz", nullable: true, default: null, onUpdate: () => new Date() },
        lastActions: { type: "jsonb", defaultRaw: "'{}'::jsonb", nullable: false },
        createdAt: { type: "timestamptz", defaultRaw: "now()", nullable: false },
        isRevoked: { type: "boolean", default: false, nullable: false },
        version: { type: "int", version: true },
    },
});
