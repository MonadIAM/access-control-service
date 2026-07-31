import { EntitySchema } from "@mikro-orm/core";

import { RolePermissionAssignment, Permission, Role, Realm } from "~context/domain/entities";
import { AssignmentScope } from "~context/enums";

export const RolePermissionAssignmentSchema = new EntitySchema<RolePermissionAssignment>({
    class: RolePermissionAssignment,
    tableName: "role_permission_assignment",
    schema: "access_control",

    uniques: [
        {
            name: "role_permission_assignment_role_permission_unique",
            properties: ["role", "permission"],
        },
    ],

    indexes: [
        {
            name: "role_permission_assignment_permission_idx",
            properties: ["permission"],
        },
        {
            name: "role_permission_assignment_realm_idx",
            properties: ["realm"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        scope: { enum: true, items: () => AssignmentScope, nativeEnumName: "role_permission_assignment_scope" },

        isSystemManaged: { type: "boolean" },
        isRevoked: { type: "boolean" },

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
        permission: {
            kind: "m:1",
            entity: () => Permission,
            fieldName: "permission_id",
            deleteRule: "cascade",
        },

        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
        version: { type: "int", version: true },
    },
});
