import { EntitySchema } from "@mikro-orm/core";

import { RealmType } from "~context/enums";
import { Realm } from "~context/domain/entities";

export const RealmSchema = new EntitySchema<Realm>({
    class: Realm,
    tableName: "realm",
    schema: "access_control",

    uniques: [
        {
            name: "realm_code_unique",
            properties: ["code"],
        },
    ],

    indexes: [
        {
            name: "realm_name_trgm_idx",
            expression: 'CREATE INDEX "realm_name_trgm_idx" ON "access_control"."realm" USING gin ("name" gin_trgm_ops)',
        },
        {
            name: "realm_owner_idx",
            properties: ["owner"],
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        description: { type: "text", nullable: true },
        code: { type: "text" },
        type: { enum: true, items: () => RealmType, nativeEnumName: "realm_type" },
        name: { type: "text" },
        owner: { type: "uuid" },

        isSystemManaged: { type: "boolean" },
        isRevoked: { type: "boolean" },
        isSystemRevoked: { type: "boolean", default: false },

        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
        version: { type: "int", version: true },
    },
});
