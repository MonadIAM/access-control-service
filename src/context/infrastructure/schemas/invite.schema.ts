import { EntitySchema } from "@mikro-orm/core";

import { Invite, Realm, Role } from "~context/domain/entities";
import { InviteStatus } from "~context/enums";

export const InviteSchema = new EntitySchema<Invite>({
    class: Invite,
    tableName: "invite",
    schema: "access_control",

    indexes: [
        {
            name: "invite_invitee_idx",
            properties: ["invitee"],
        },
        {
            name: "invite_inviter_idx",
            properties: ["inviter"],
        },
        {
            name: "invite_realm_invitee_role_pending_unique",
            expression:
                'CREATE UNIQUE INDEX "invite_realm_invitee_role_pending_unique" ON "access_control"."invite" ("realm_id", "invitee", "role_id") WHERE "status" = \'PENDING\'',
        },
    ],

    properties: {
        id: { primary: true, type: "uuid" },

        status: { enum: true, items: () => InviteStatus, nativeEnumName: "invite_status" },
        invitee: { type: "uuid" },
        inviter: { type: "uuid" },

        realm: {
            kind: "m:1",
            entity: () => Realm,
            fieldName: "realm_id",
            deleteRule: "cascade",
        },
        role: {
            kind: "m:1",
            entity: () => Role,
            fieldName: "role_id",
            deleteRule: "cascade",
        },

        updatedAt: { type: "timestamptz", length: 3, nullable: true },
        createdAt: { type: "timestamptz", length: 3 },
        version: { type: "int", version: true },
    },
});
