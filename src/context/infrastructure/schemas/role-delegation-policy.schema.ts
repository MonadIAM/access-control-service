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
            name: "role_delegation_policy_delegator_idx",
            properties: ["delegator"],
        },
        {
            name: "role_delegation_policy_target_idx",
            properties: ["target"],
        },
        {
            name: "role_delegation_policy_expires_at_idx",
            properties: ["expiresAt"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        description: { type: "text", nullable: true },
        depthLimit: { type: "smallint" },

        isSystemManaged: { type: "boolean" },
        isRevoked: { type: "boolean" },

        realm: {
            kind: "m:1",
            entity: () => Realm,
            fieldName: "realm_id",
            deleteRule: "cascade",
        },
        delegator: {
            kind: "m:1",
            entity: () => Role,
            fieldName: "delegator_id",
            deleteRule: "cascade",
        },
        target: {
            kind: "m:1",
            entity: () => Role,
            fieldName: "target_id",
            deleteRule: "cascade",
        },

        expiresAt: { type: "timestamptz", length: 3, nullable: true },
        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
        version: { type: "int", version: true },
    },
});
