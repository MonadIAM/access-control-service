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

        isSystemManaged: { type: "boolean", nullable: false },
        code: { type: "string", length: 128, nullable: false },
        name: { type: "string", length: 255, nullable: false },
        description: { type: "text", nullable: true },

        createdAt: { type: "timestamptz", length: 3, nullable: false },
        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        lastActions: { type: "jsonb", nullable: false },
        isRevoked: { type: "boolean", nullable: false },
        version: { type: "int", version: true },
    },
});
