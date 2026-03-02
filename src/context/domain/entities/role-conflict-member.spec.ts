import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { RoleConflictMember } from "./role-conflict-member.entity";
import { RoleConflictGroup } from "./role-conflict-group.entity";
import { Role } from "./role.entity";

const ACTOR_ID = "00000000-0000-4000-8000-000000000000";

function createMember(overrides?: Partial<Entities.RoleConflictMember.ConstructorProps>): RoleConflictMember {
    return new RoleConflictMember({
        actor: ACTOR_ID,
        group: {} as RoleConflictGroup,
        role: {} as Role,
        ...overrides,
    });
}

describe("RoleConflictMember Entity", () => {
    describe("constructor", () => {
        it("should assign required relations", () => {
            const group = {} as RoleConflictGroup;
            const role = {} as Role;

            const member = new RoleConflictMember({ actor: ACTOR_ID, group, role });

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

        it("should populate lastActions.create", () => {
            const member = createMember();

            expect(member.lastActions).toEqual({ create: { by: { id: ACTOR_ID } } });
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
    });
});
