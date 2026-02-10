import { EntitySchema } from "@mikro-orm/core";

import { RoleActorType, RoleProtoType } from "~context/enums";
import {
    RoleDelegationPolicy,
    RolePermissionMatrix,
    RoleConflictMember,
    AccountRoleMatrix,
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
        id: { primary: true, type: "uuid", defaultRaw: "gen_random_uuid()" },

        actorType: { enum: true, items: () => RoleActorType, nullable: false },
        protoType: { enum: true, items: () => RoleProtoType, nullable: false },
        isSystemManaged: { type: "boolean", default: false, nullable: false },
        nonDelegable: { type: "boolean", default: false, nullable: false },
        code: { type: "string", length: 128, nullable: false },
        name: { type: "string", length: 255, nullable: false },
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
        permissionMatrix: {
            kind: "1:m",
            entity: () => RolePermissionMatrix,
            mappedBy: "role",
        },
        accountMatrix: {
            kind: "1:m",
            entity: () => AccountRoleMatrix,
            mappedBy: "role",
        },

        updatedAt: { type: "timestamptz", length: 3, nullable: true, default: null, onUpdate: () => new Date() },
        createdAt: { type: "timestamptz", length: 3, defaultRaw: "now()", nullable: false },
        lastActions: { type: "jsonb", defaultRaw: "'{}'::jsonb", nullable: false },
        isRevoked: { type: "boolean", default: false, nullable: false },
        version: { type: "int", version: true },
    },
});
