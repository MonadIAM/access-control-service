import { EntitySchema } from "@mikro-orm/core";

import { RoleClosure, Realm, Role } from "~context/domain/entities";

export const RoleClosureSchema = new EntitySchema<RoleClosure>({
    class: RoleClosure,
    tableName: "role_closure",
    schema: "access_control",

    indexes: [
        {
            name: "role_closure_ancestor_depth_idx",
            properties: ["ancestor", "depth"],
        },
        {
            name: "role_closure_descendant_depth_idx",
            properties: ["descendant", "depth"],
        },
    ],

    properties: {
        depth: { type: "smallint" },

        realm: {
            kind: "m:1",
            primary: true,
            entity: () => Realm,
            fieldName: "realm_id",
            deleteRule: "cascade",
        },
        ancestor: {
            kind: "m:1",
            primary: true,
            entity: () => Role,
            fieldName: "ancestor_id",
            deleteRule: "cascade",
        },
        descendant: {
            kind: "m:1",
            primary: true,
            entity: () => Role,
            fieldName: "descendant_id",
            deleteRule: "cascade",
        },
    },
});
