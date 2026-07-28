import { EntitySchema } from "@mikro-orm/core";

import { RoleActorType, RoleArchetype } from "~context/enums";
import {
    RolePermissionAssignment,
    AccountRoleAssignment,
    RoleDelegationPolicy,
    RoleConflictMember,
    Realm,
    Role,
} from "~context/domain/entities";

export const RoleSchema = new EntitySchema<Role>({
    class: Role,
    tableName: "role",
    schema: "access_control",

    uniques: [
        {
            name: "role_realm_code_unique",
            properties: ["realm", "code"],
        },
    ],

    indexes: [
        {
            name: "role_name_trgm_idx",
            expression: 'CREATE INDEX "role_name_trgm_idx" ON "access_control"."role" USING gin ("name" gin_trgm_ops)',
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        code: { type: "string", length: 128 },
        name: { type: "string", length: 255 },
        description: { type: "text", nullable: true },
        actorType: { enum: true, items: () => RoleActorType },
        archetype: { enum: true, items: () => RoleArchetype },

        isSystemManaged: { type: "boolean" },
        nonDelegable: { type: "boolean" },
        isRevoked: { type: "boolean" },

        realm: {
            kind: "m:1",
            entity: () => Realm,
            fieldName: "realm_id",
            deleteRule: "cascade",
        },

        delegationPoliciesAsDelegator: {
            kind: "1:m",
            entity: () => RoleDelegationPolicy,
            mappedBy: "delegator",
        },
        delegationPoliciesAsTarget: {
            kind: "1:m",
            entity: () => RoleDelegationPolicy,
            mappedBy: "target",
        },
        conflictMemberships: {
            kind: "1:m",
            entity: () => RoleConflictMember,
            mappedBy: "role",
        },
        permissionAssignments: {
            kind: "1:m",
            entity: () => RolePermissionAssignment,
            mappedBy: "role",
        },
        accountAssignment: {
            kind: "1:m",
            entity: () => AccountRoleAssignment,
            mappedBy: "role",
        },

        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
        version: { type: "int", version: true },
    },
});
