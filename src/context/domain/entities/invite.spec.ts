import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { InviteStatus } from "~context/enums";

import { Invite } from "./invite.entity";
import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

const INVITEE_ID = "00000000-0000-4000-8000-000000000001";
const INVITER_ID = "00000000-0000-4000-8000-000000000002";

function createInvite(overrides?: Partial<Entities.Invite.ConstructorProps>): Invite {
    return new Invite({
        invitee: INVITEE_ID,
        inviter: INVITER_ID,
        realm: {} as Realm,
        role: {} as Role,
        ...overrides,
    });
}

describe("Invite Entity", () => {
    describe("constructor", () => {
        it("should assign required fields and relations", () => {
            const realm = {} as Realm;
            const role = {} as Role;

            const invite = createInvite({ invitee: INVITEE_ID, inviter: INVITER_ID, realm, role });

            expect(invite.invitee).toBe(INVITEE_ID);
            expect(invite.inviter).toBe(INVITER_ID);
            expect(invite.realm).toBe(realm);
            expect(invite.role).toBe(role);
        });

        it("should default status to PENDING", () => {
            const invite = createInvite();

            expect(invite.status).toBe(InviteStatus.PENDING);
        });

        it("should auto-generate id, createdAt, version", () => {
            const invite = createInvite();

            expect(isUUID(invite.id, "4")).toBe(true);
            expect(invite.createdAt).toBeInstanceOf(Date);
            expect(invite.version).toBe(1);
            expect(invite.updatedAt).toBeUndefined();
        });
    });

    describe("cancel", () => {
        it("should cancel a pending invite", () => {
            const invite = createInvite();
            invite.cancel();

            expect(invite.status).toBe(InviteStatus.CANCELLED);
            expect(invite.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when invite is not pending", () => {
            const invite = createInvite();
            invite.cancel();

            expect(() => invite.cancel()).toThrow("CANNOT_CANCEL_INACTIVE");
        });
    });

    describe("accept", () => {
        it("should accept a pending invite", () => {
            const invite = createInvite();
            invite.accept();

            expect(invite.status).toBe(InviteStatus.ACCEPTED);
            expect(invite.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when invite is not pending", () => {
            const invite = createInvite();
            invite.accept();

            expect(() => invite.accept()).toThrow("CANNOT_ACCEPT_INACTIVE");
        });
    });

    describe("decline", () => {
        it("should decline a pending invite", () => {
            const invite = createInvite();
            invite.decline();

            expect(invite.status).toBe(InviteStatus.DECLINED);
            expect(invite.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when invite is not pending", () => {
            const invite = createInvite();
            invite.decline();

            expect(() => invite.decline()).toThrow("CANNOT_DECLINE_INACTIVE");
        });
    });
});
