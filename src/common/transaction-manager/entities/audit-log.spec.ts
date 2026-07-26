import { describe, it, expect } from "@jest/globals";
import { isUUID } from "class-validator";

import { AuditLog } from "./audit-log.entity";

const ACTOR_ID = "00000000-0000-4000-8000-000000000001";

const BASE_CONTEXT: Extract.Meta = {
    userAgent: "Mozilla/5.0",
    ip: "127.0.0.1",
};

function createAuditLog(overrides?: Partial<SystemEntities.AuditLog.ConstructorProps>): AuditLog {
    return new AuditLog({
        context: BASE_CONTEXT,
        actionType: "CREATE",
        entityType: "REALM",
        actor: ACTOR_ID,
        ...overrides,
    });
}

describe("AuditLog Entity", () => {
    describe("constructor", () => {
        it("should assign required fields", () => {
            const log = createAuditLog();

            expect(log.actionType).toBe("CREATE");
            expect(log.entityType).toBe("REALM");
            expect(log.actor).toBe(ACTOR_ID);
        });

        it("should auto-generate id and createdAt", () => {
            const log = createAuditLog();

            expect(isUUID(log.id, "4")).toBe(true);
            expect(log.createdAt).toBeInstanceOf(Date);
        });

        it("should assign ip and userAgent from context", () => {
            const log = createAuditLog();

            expect(log.ip).toBe(BASE_CONTEXT.ip);
            expect(log.userAgent).toBe(BASE_CONTEXT.userAgent);
        });

        it("should assign optional realm when provided", () => {
            const log = createAuditLog({ realm: "some-realm" });

            expect(log.realm).toBe("some-realm");
        });

        it("should leave realm undefined when omitted", () => {
            const log = createAuditLog();

            expect(log.realm).toBeUndefined();
        });

        it("should assign optional input when provided", () => {
            const input = { name: "test" };
            const log = createAuditLog({ input });

            expect(log.input).toBe(input);
        });

        it("should leave input undefined when omitted", () => {
            const log = createAuditLog();

            expect(log.input).toBeUndefined();
        });
    });
});
