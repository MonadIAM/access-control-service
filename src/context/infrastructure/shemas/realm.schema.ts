import { EntitySchema } from "@mikro-orm/core";

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
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        code: { type: "string", length: 128 },
        name: { type: "string", length: 255 },
        description: { type: "text", nullable: true },
        isSystemManaged: { type: "boolean" },

        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
        version: { type: "int", version: true },
        lastActions: { type: "jsonb" },
        isRevoked: { type: "boolean" },
    },
});
