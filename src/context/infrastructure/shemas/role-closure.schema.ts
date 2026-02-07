import { EntitySchema } from "@mikro-orm/core";

import { RoleClosure, Realm, Role } from "~context/domain/entities";

export const RoleClosureSchema = new EntitySchema<RoleClosure>({
    class: RoleClosure,
    tableName: "role_closure",
    schema: "access_control",

    indexes: [
        {
            name: "role_closure_realm_ancestor_idx",
            properties: ["realm", "ancestor"],
        },
        {
            name: "role_closure_realm_descendant_idx",
            properties: ["realm", "descendant"],
        },
    ],

    properties: {
        depth: { type: "int", nullable: false },

        realm: {
            kind: "m:1",
            primary: true,
            nullable: false,
            entity: () => Realm,
            fieldName: "realm_id",
            deleteRule: "cascade",
        },
        ancestor: {
            kind: "m:1",
            primary: true,
            nullable: false,
            entity: () => Role,
            fieldName: "ancestor_id",
            deleteRule: "cascade",
        },
        descendant: {
            kind: "m:1",
            primary: true,
            nullable: false,
            entity: () => Role,
            fieldName: "descendant_id",
            deleteRule: "cascade",
        },
    },
});
