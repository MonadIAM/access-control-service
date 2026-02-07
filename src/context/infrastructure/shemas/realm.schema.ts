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
        id: { primary: true, type: "uuid", defaultRaw: "gen_random_uuid()" },

        isSystemManaged: { type: "boolean", default: false, nullable: false },
        code: { type: "string", length: 128, nullable: false },
        name: { type: "string", length: 255, nullable: false },
        description: { type: "text", nullable: true },

        updatedAt: { type: "timestamptz", nullable: true, default: null, onUpdate: () => new Date() },
        lastActions: { type: "jsonb", defaultRaw: "'{}'::jsonb", nullable: false },
        createdAt: { type: "timestamptz", defaultRaw: "now()", nullable: false },
        isRevoked: { type: "boolean", default: false, nullable: false },
        version: { type: "int", version: true },
    },
});
