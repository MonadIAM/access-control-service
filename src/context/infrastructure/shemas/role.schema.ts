import { EntitySchema } from "@mikro-orm/core";

import { RoleActorType, RoleProtoType } from "~context/enums";
import {
    RoleDelegationPolicy,
    RolePermissionAssignment,
    RoleConflictMember,
    AccountRoleAssignment,
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

        actorType: { enum: true, items: () => RoleActorType, nullable: false },
        protoType: { enum: true, items: () => RoleProtoType, nullable: false },
        code: { type: "string", length: 128, nullable: false },
        name: { type: "string", length: 255, nullable: false },
        isSystemManaged: { type: "boolean", nullable: false },
        nonDelegable: { type: "boolean", nullable: false },
        description: { type: "text", nullable: true },

        realm: {
            kind: "m:1",
            nullable: false,
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

        createdAt: { type: "timestamptz", length: 3, nullable: false },
        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        lastActions: { type: "jsonb", nullable: false },
        isRevoked: { type: "boolean", nullable: false },
        version: { type: "int", version: true },
    },
});
