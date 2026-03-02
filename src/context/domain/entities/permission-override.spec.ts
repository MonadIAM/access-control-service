import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { PermissionOverrideEffect } from "~context/enums";

import { PermissionOverride } from "./permission-override.entity";
import { Permission } from "./permission.entity";
import { Realm } from "./realm.entity";

const ACTOR_ID = "00000000-0000-4000-8000-000000000000";
const ACCOUNT_ID = "00000000-0000-4000-8000-000000000001";

function createOverride(overrides?: Partial<Entities.PermissionOverride.ConstructorProps>): PermissionOverride {
    return new PermissionOverride({
        actor: ACTOR_ID,
        account: ACCOUNT_ID,
        effect: PermissionOverrideEffect.ALLOW,
        permission: {} as Permission,
        realm: {} as Realm,
        ...overrides,
    });
}

describe("PermissionOverride Entity", () => {
    describe("constructor", () => {
        it("should assign required fields and relations", () => {
            const permission = {} as Permission;
            const realm = {} as Realm;

            const override = createOverride({
                account: ACCOUNT_ID,
                effect: PermissionOverrideEffect.DENY,
                permission,
                realm,
            });

            expect(override.account).toBe(ACCOUNT_ID);
            expect(override.effect).toBe(PermissionOverrideEffect.DENY);
            expect(override.permission).toBe(permission);
            expect(override.realm).toBe(realm);
        });

        it("should default isRevoked to false", () => {
            const override = createOverride();

            expect(override.isRevoked).toBe(false);
        });

        it("should respect explicit isRevoked override", () => {
            const override = createOverride({ isRevoked: true });

            expect(override.isRevoked).toBe(true);
        });

        it("should auto-generate id, createdAt, version", () => {
            const override = createOverride();

            expect(isUUID(override.id, "4")).toBe(true);
            expect(override.createdAt).toBeInstanceOf(Date);
            expect(override.version).toBe(1);
            expect(override.updatedAt).toBeUndefined();
        });

        it("should populate lastActions.create", () => {
            const override = createOverride();

            expect(override.lastActions).toEqual({ create: { by: { id: ACTOR_ID } } });
        });
    });

    describe("revoke", () => {
        it("should revoke an active override", () => {
            const override = createOverride();
            override.revoke({ actor: ACTOR_ID, reason: "cleanup" });

            expect(override.isRevoked).toBe(true);
            expect(override.updatedAt).toBeInstanceOf(Date);
            expect(override.lastActions.revoke).toMatchObject({ by: { id: ACTOR_ID }, reason: "cleanup" });
        });

        it("should throw when already revoked", () => {
            const override = createOverride();
            override.revoke({ actor: ACTOR_ID, reason: "first" });

            expect(() => override.revoke({ actor: ACTOR_ID, reason: "second" })).toThrow("ALREADY_REVOKED");
        });
    });

    describe("restore", () => {
        it("should restore a revoked override", () => {
            const override = createOverride();
            override.revoke({ actor: ACTOR_ID, reason: "temp" });
            override.restore({ actor: ACTOR_ID, reason: "re-enable" });

            expect(override.isRevoked).toBe(false);
            expect(override.updatedAt).toBeInstanceOf(Date);
            expect(override.lastActions.restore).toMatchObject({ by: { id: ACTOR_ID }, reason: "re-enable" });
        });

        it("should throw when already active", () => {
            const override = createOverride();

            expect(() => override.restore({ actor: ACTOR_ID, reason: "noop" })).toThrow("ALREADY_ACTIVE");
        });
    });

    describe("canPurge", () => {
        it("should throw for active override", () => {
            const override = createOverride();

            expect(() => override.canPurge()).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("should pass for revoked override", () => {
            const override = createOverride();
            override.revoke({ actor: ACTOR_ID, reason: "purge" });

            expect(() => override.canPurge()).not.toThrow();
        });
    });
});
