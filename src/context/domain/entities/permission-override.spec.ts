import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { PermissionOverrideEffect } from "~context/enums";

import { PermissionOverride } from "./permission-override.entity";
import { Permission } from "./permission.entity";
import { Realm } from "./realm.entity";

const ACCOUNT_ID = "00000000-0000-4000-8000-000000000001";

function createOverride(overrides?: Partial<Entities.PermissionOverride.ConstructorProps>): PermissionOverride {
    return new PermissionOverride({
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

        it("should normalize explicit expiration to the start of the day", () => {
            const expiresAt = new Date(2999, 4, 15, 13, 45, 30, 123);
            const expected = new Date(expiresAt);
            expected.setHours(0, 0, 0, 0);

            const override = createOverride({ expiresAt });

            expect(override.expiresAt).toEqual(expected);
            expect(override.expiresAt).not.toBe(expiresAt);
        });

        it("should leave expiration undefined when not provided", () => {
            const override = createOverride();

            expect(override.expiresAt).toBeUndefined();
        });

        it("should auto-generate id, createdAt, version", () => {
            const override = createOverride();

            expect(isUUID(override.id, "4")).toBe(true);
            expect(override.createdAt).toBeInstanceOf(Date);
            expect(override.version).toBe(1);
            expect(override.updatedAt).toBeUndefined();
        });
    });

    describe("revoke", () => {
        it("should revoke an active override", () => {
            const override = createOverride();
            override.revoke();

            expect(override.isRevoked).toBe(true);
            expect(override.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when already revoked", () => {
            const override = createOverride();
            override.revoke();

            expect(() => override.revoke()).toThrow("ALREADY_REVOKED");
        });
    });

    describe("restore", () => {
        it("should restore a revoked override", () => {
            const override = createOverride();
            override.revoke();
            override.restore();

            expect(override.isRevoked).toBe(false);
            expect(override.updatedAt).toBeInstanceOf(Date);
        });

        it("should restore a revoked override with future expiration", () => {
            const override = createOverride({ expiresAt: new Date(2999, 4, 15, 13, 45, 30, 123) });
            override.revoke();
            override.restore();

            expect(override.isRevoked).toBe(false);
            expect(override.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when already active", () => {
            const override = createOverride();

            expect(() => override.restore()).toThrow("ALREADY_ACTIVE");
        });

        it("should throw when expired", () => {
            const override = createOverride({ expiresAt: new Date(2000, 0, 1, 13, 45, 30, 123) });
            override.revoke();

            expect(() => override.restore()).toThrow("CANNOT_RESTORE_EXPIRED");
        });
    });

    describe("canPurge", () => {
        it("should throw for active override", () => {
            const override = createOverride();

            expect(() => override.canPurge()).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("should pass for revoked override", () => {
            const override = createOverride();
            override.revoke();

            expect(() => override.canPurge()).not.toThrow();
        });
    });

    describe("canCreate", () => {
        it("should pass when non-expiring", () => {
            const override = createOverride();

            expect(() => override.canCreate()).not.toThrow();
        });

        it("should pass when expiration is in the future", () => {
            const override = createOverride({ expiresAt: new Date(2999, 4, 15, 13, 45, 30, 123) });

            expect(() => override.canCreate()).not.toThrow();
        });

        it("should throw for expired override", () => {
            const override = createOverride({ expiresAt: new Date(2000, 0, 1, 13, 45, 30, 123) });

            expect(() => override.canCreate()).toThrow("CANNOT_CREATE_EXPIRED");
        });
    });
});
