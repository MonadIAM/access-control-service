import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { AssignmentScope } from "~context/enums";

import { RolePermissionAssignment } from "./role-permission-assignment.entity";
import { Permission } from "./permission.entity";
import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

const ACTOR_ID = "00000000-0000-4000-8000-000000000000";

function stubRole(overrides?: Partial<Role>): Role {
    return { isRevoked: false, isSystemManaged: false, ...overrides } as Role;
}

function stubPermission(overrides?: Partial<Permission>): Permission {
    return { isRevoked: false, isSystemManaged: false, ...overrides } as Permission;
}

function createAssignment(
    overrides?: Partial<Entities.RolePermissionAssignment.ConstructorProps>,
): RolePermissionAssignment {
    return new RolePermissionAssignment({
        actor: ACTOR_ID,
        permission: stubPermission(),
        realm: {} as Realm,
        role: stubRole(),
        ...overrides,
    });
}

describe("RolePermissionAssignment Entity", () => {
    describe("constructor", () => {
        it("should assign required relations", () => {
            const role = stubRole();
            const permission = stubPermission();
            const realm = {} as Realm;

            const assignment = new RolePermissionAssignment({
                actor: ACTOR_ID,
                permission,
                realm,
                role,
            });

            expect(assignment.role).toBe(role);
            expect(assignment.permission).toBe(permission);
            expect(assignment.realm).toBe(realm);
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

        it("should auto-generate id, createdAt, version and set scope", () => {
            const assignment = createAssignment();

            expect(isUUID(assignment.id, "4")).toBe(true);
            expect(assignment.createdAt).toBeInstanceOf(Date);
            expect(assignment.version).toBe(1);
            expect(assignment.updatedAt).toBeUndefined();
            expect(assignment.scope).toBe(AssignmentScope.REALM);
        });

        it("should populate lastActions.create", () => {
            const assignment = createAssignment();

            expect(assignment.lastActions).toEqual({ create: { by: { id: ACTOR_ID } } });
        });
    });

    describe("revoke", () => {
        it("should revoke an active assignment", () => {
            const assignment = createAssignment();
            assignment.revoke({ actor: ACTOR_ID, reason: "cleanup" });

            expect(assignment.isRevoked).toBe(true);
            expect(assignment.updatedAt).toBeInstanceOf(Date);
            expect(assignment.lastActions.revoke).toMatchObject({ by: { id: ACTOR_ID }, reason: "cleanup" });
        });

        it("should throw when already revoked", () => {
            const assignment = createAssignment();
            assignment.revoke({ actor: ACTOR_ID, reason: "first" });

            expect(() => assignment.revoke({ actor: ACTOR_ID, reason: "second" })).toThrow("ALREADY_REVOKED");
        });
    });

    describe("restore", () => {
        it("should restore a revoked assignment", () => {
            const assignment = createAssignment();
            assignment.revoke({ actor: ACTOR_ID, reason: "temp" });
            assignment.restore({ actor: ACTOR_ID, reason: "re-enable" });

            expect(assignment.isRevoked).toBe(false);
            expect(assignment.updatedAt).toBeInstanceOf(Date);
            expect(assignment.lastActions.restore).toMatchObject({ by: { id: ACTOR_ID }, reason: "re-enable" });
        });

        it("should throw when already active", () => {
            const assignment = createAssignment();

            expect(() => assignment.restore({ actor: ACTOR_ID, reason: "noop" })).toThrow("ALREADY_ACTIVE");
        });
    });

    describe("canPurge", () => {
        it("should throw for active assignment", () => {
            const assignment = createAssignment();

            expect(() => assignment.canPurge()).toThrow("CANNOT_PURGE_ACTIVE");
        });

        it("should throw for revoked system-managed assignment", () => {
            const assignment = createAssignment({ isSystemManaged: true });
            assignment.revoke({ actor: ACTOR_ID, reason: "purge" });

            expect(() => assignment.canPurge()).toThrow("CANNOT_PURGE_SYSTEM");
        });

        it("should pass for revoked non-system assignment", () => {
            const assignment = createAssignment();
            assignment.revoke({ actor: ACTOR_ID, reason: "purge" });

            expect(() => assignment.canPurge()).not.toThrow();
        });
    });

    describe("canAssign", () => {
        it("should pass when role and permission are active and non-system", () => {
            const assignment = createAssignment();

            expect(() => assignment.canAssign()).not.toThrow();
        });

        it("should throw for revoked role", () => {
            const assignment = createAssignment({ role: stubRole({ isRevoked: true }) });

            expect(() => assignment.canAssign()).toThrow("CANNOT_ASSIGN_TO_REVOKED_ROLE");
        });

        it("should throw for revoked permission", () => {
            const assignment = createAssignment({ permission: stubPermission({ isRevoked: true }) });

            expect(() => assignment.canAssign()).toThrow("CANNOT_ASSIGN_REVOKED_PERMISSION");
        });

        it("should throw for system-managed role", () => {
            const assignment = createAssignment({ role: stubRole({ isSystemManaged: true }) });

            expect(() => assignment.canAssign()).toThrow("CANNOT_ASSIGN_TO_SYSTEM_ROLE");
        });

        it("should throw for system-managed permission", () => {
            const assignment = createAssignment({ permission: stubPermission({ isSystemManaged: true }) });

            expect(() => assignment.canAssign()).toThrow("CANNOT_ASSIGN_SYSTEM_PERMISSION");
        });
    });
});
