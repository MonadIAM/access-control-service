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
        id: { primary: true, type: "uuid" },

        isSystemManaged: { type: "boolean", nullable: false },
        depthLimit: { type: "smallint", nullable: false },
        description: { type: "text", nullable: true },

        realm: {
            kind: "m:1",
            nullable: false,
            entity: () => Realm,
            fieldName: "realm_id",
            deleteRule: "cascade",
        },
        delegator: {
            kind: "m:1",
            nullable: false,
            entity: () => Role,
            fieldName: "delegator_id",
            deleteRule: "cascade",
        },
        target: {
            kind: "m:1",
            nullable: false,
            entity: () => Role,
            fieldName: "target_id",
            deleteRule: "cascade",
        },

        createdAt: { type: "timestamptz", length: 3, nullable: false },
        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        lastActions: { type: "jsonb", nullable: false },
        isRevoked: { type: "boolean", nullable: false },
        version: { type: "int", version: true },
    },
});
