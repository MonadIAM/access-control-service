import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { AccountRoleAssignment } from "./account-role-assignment.entity";
import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

const ACCOUNT_ID = "00000000-0000-4000-8000-000000000001";

function stubRole(overrides?: Partial<Role>): Role {
    return { isRevoked: false, isSystemManaged: false, ...overrides } as Role;
}

function createAssignment(overrides?: Partial<Entities.AccountRoleAssignment.ConstructorProps>): AccountRoleAssignment {
    return new AccountRoleAssignment({
        account: ACCOUNT_ID,
        realm: {} as Realm,
        role: stubRole(),
        ...overrides,
    });
}

describe("AccountRoleAssignment Entity", () => {
    describe("constructor", () => {
        it("should assign required fields and relations", () => {
            const realm = {} as Realm;
            const role = stubRole();

            const assignment = createAssignment({ account: ACCOUNT_ID, realm, role });

            expect(assignment.account).toBe(ACCOUNT_ID);
            expect(assignment.realm).toBe(realm);
            expect(assignment.role).toBe(role);
        });

        it("should default booleans to false", () => {
            const assignment = createAssignment();

            expect(assignment.isSystemManaged).toBe(false);
            expect(assignment.isRevoked).toBe(false);
        });

        it("should respect explicit boolean overrides", () => {
            const assignment = createAssignment({ isSystemManaged: true, isRevoked: true });

            expect(assignment.isSystemManaged).toBe(true);
            expect(assignment.isRevoked).toBe(true);
        });

        it("should auto-generate id, createdAt, version", () => {
            const assignment = createAssignment();

            expect(isUUID(assignment.id, "4")).toBe(true);
            expect(assignment.createdAt).toBeInstanceOf(Date);
            expect(assignment.version).toBe(1);
            expect(assignment.updatedAt).toBeUndefined();
        });
    });

    describe("revoke", () => {
        it("should revoke an active assignment", () => {
            const assignment = createAssignment();
            assignment.revoke();

            expect(assignment.isRevoked).toBe(true);
            expect(assignment.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when already revoked", () => {
            const assignment = createAssignment();
            assignment.revoke();

            expect(() => assignment.revoke()).toThrow("ALREADY_REVOKED");
        });
    });

    describe("restore", () => {
        it("should restore a revoked assignment", () => {
            const assignment = createAssignment();
            assignment.revoke();
            assignment.restore();

            expect(assignment.isRevoked).toBe(false);
            expect(assignment.updatedAt).toBeInstanceOf(Date);
        });

        it("should throw when already active", () => {
            const assignment = createAssignment();

            expect(() => assignment.restore()).toThrow("ALREADY_ACTIVE");
        });
    });

    describe("canPurge", () => {
        it("should throw for active assignment", () => {
            const assignment = createAssignment();

            expect(() => assignment.canPurge()).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("should throw for revoked system-managed assignment", () => {
            const assignment = createAssignment({ isSystemManaged: true });
            assignment.revoke();

            expect(() => assignment.canPurge()).toThrow("CANNOT_PURGE_SYSTEM");
        });

        it("should pass for revoked non-system assignment", () => {
            const assignment = createAssignment();
            assignment.revoke();

            expect(() => assignment.canPurge()).not.toThrow();
        });
    });

    describe("canAssign", () => {
        it("should pass when role is active and non-system", () => {
            const assignment = createAssignment();

            expect(() => assignment.canAssign()).not.toThrow();
        });

        it("should throw for revoked role", () => {
            const assignment = createAssignment({ role: stubRole({ isRevoked: true }) });

            expect(() => assignment.canAssign()).toThrow("CANNOT_ASSIGN_REVOKED_ROLE");
        });

        it("should throw for system-managed role", () => {
            const assignment = createAssignment({ role: stubRole({ isSystemManaged: true }) });

            expect(() => assignment.canAssign()).toThrow("CANNOT_ASSIGN_SYSTEM_ROLE");
        });
    });
});
