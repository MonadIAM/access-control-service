import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { RoleConflictMember } from "./role-conflict-member.entity";
import { RoleConflictGroup } from "./role-conflict-group.entity";
import { Realm } from "./realm.entity";
import { Role } from "./role.entity";

function createGroup(overrides?: Partial<Entities.RoleConflictGroup.ConstructorProps>): RoleConflictGroup {
    return new RoleConflictGroup({
        code: "SoD_FINANCE",
        name: "Finance Separation",
        maxAllowed: 1,
        realm: {} as Realm,
        ...overrides,
    });
}

function createMember(overrides?: Partial<Entities.RoleConflictMember.ConstructorProps>): RoleConflictMember {
    return new RoleConflictMember({
        group: createGroup(),
        role: {} as Role,
        ...overrides,
    });
}

describe("RoleConflictMember Entity", () => {
    describe("constructor", () => {
        it("should assign required relations", () => {
            const group = {} as RoleConflictGroup;
            const role = {} as Role;

            const member = new RoleConflictMember({ group, role });

            expect(member.group).toBe(group);
            expect(member.role).toBe(role);
        });

        it("should default booleans to false", () => {
            const member = createMember();

            expect(member.isSystemManaged).toBe(false);
            expect(member.isRevoked).toBe(false);
        });

        it("should respect explicit boolean overrides", () => {
            const member = createMember({ isSystemManaged: true, isRevoked: true });

            expect(member.isSystemManaged).toBe(true);
            expect(member.isRevoked).toBe(true);
        });

        it("should auto-generate id, createdAt, version", () => {
            const member = createMember();

            expect(isUUID(member.id, "4")).toBe(true);
            expect(member.createdAt).toBeInstanceOf(Date);
            expect(member.version).toBe(1);
            expect(member.updatedAt).toBeUndefined();
        });
    });

    describe("canPurge", () => {
        it("should throw for system-managed member", () => {
            const member = createMember({ isSystemManaged: true });

            expect(() => member.canPurge()).toThrow("CANNOT_PURGE_SYSTEM");
        });

        it("should pass for non-system member", () => {
            const member = createMember();

            expect(() => member.canPurge()).not.toThrow();
        });

        it("should throw when the owning group is revoked", () => {
            const group = createGroup();
            group.revoke();
            const member = createMember({ group });

            expect(() => member.canPurge()).toThrow("CANNOT_MODIFY_MEMBERS_REVOKED");
        });
    });
});
