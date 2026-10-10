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

describe("[Entity] - AuditLog", () => {
    describe("[Method] - constructor", () => {
        it("[case] - assigns required fields", () => {
            // Arrange

            // Act
            const log = createAuditLog();

            // Assert
            expect(log.actionType).toBe("CREATE");
            expect(log.entityType).toBe("REALM");
            expect(log.actor).toBe(ACTOR_ID);
        });

        it("[case] - generates id and createdAt", () => {
            // Arrange

            // Act
            const log = createAuditLog();

            const result = isUUID(log.id, "4");

            // Assert
            expect(result).toBe(true);
            expect(log.createdAt).toBeInstanceOf(Date);
        });

        it("[case] - assigns ip and userAgent from context", () => {
            // Arrange

            // Act
            const log = createAuditLog();

            // Assert
            expect(log.ip).toBe(BASE_CONTEXT.ip);
            expect(log.userAgent).toBe(BASE_CONTEXT.userAgent);
        });

        it("[case] - assigns optional realm when provided", () => {
            // Arrange

            // Act
            const log = createAuditLog({ realm: "some-realm" });

            // Assert
            expect(log.realm).toBe("some-realm");
        });

        it("[case] - leaves realm undefined when omitted", () => {
            // Arrange

            // Act
            const log = createAuditLog();

            // Assert
            expect(log.realm).toBeUndefined();
        });

        it("[case] - assigns optional input when provided", () => {
            // Arrange
            const input = { name: "test" };

            // Act
            const log = createAuditLog({ input });

            // Assert
            expect(log.input).toBe(input);
        });

        it("[case] - leaves input undefined when omitted", () => {
            // Arrange

            // Act
            const log = createAuditLog();

            // Assert
            expect(log.input).toBeUndefined();
        });
    });
});
