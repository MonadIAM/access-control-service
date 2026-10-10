import { describe, expect, it } from "@jest/globals";

import { OperationContextUnitHelpers } from "~testing/unit/transaction-manager/operation-context.helpers";

const helpers = new OperationContextUnitHelpers();

describe("[Utility] - OperationContext", () => {
    describe("[Method] - get", () => {
        it("[case] - returns undefined outside run", () => {
            // Arrange
            const context = helpers.operationContext();

            // Act
            const result = context.get();

            // Assert
            expect(result).toBeUndefined();
        });
    });

    describe("[Method] - run", () => {
        it("[case] - exposes context synchronously inside run", () => {
            // Arrange
            const context = helpers.operationContext();

            // Act
            const result = context.run({ changeLogEnabled: true, auditEntry: "audit-entry" }, () => context.get());

            // Assert
            expect(result).toEqual({ changeLogEnabled: true, auditEntry: "audit-entry" });
        });

        it("[case] - preserves context across awaits", async () => {
            // Arrange
            const context = helpers.operationContext();

            // Act
            const result = await context.run({ changeLogEnabled: true, auditEntry: "audit-entry" }, async () => {
                await Promise.resolve();
                return context.get();
            });

            // Assert
            expect(result).toEqual({ changeLogEnabled: true, auditEntry: "audit-entry" });
        });

        it("[case] - isolates parallel runs", async () => {
            // Arrange
            const context = helpers.operationContext();

            // Act
            const [first, second] = await Promise.all([
                context.run({ changeLogEnabled: true, auditEntry: "first-audit" }, async () => {
                    await Promise.resolve();
                    return context.get();
                }),
                context.run({ changeLogEnabled: true, auditEntry: "second-audit" }, async () => {
                    await Promise.resolve();
                    return context.get();
                }),
            ]);

            // Assert
            expect(first).toEqual({ changeLogEnabled: true, auditEntry: "first-audit" });
            expect(second).toEqual({ changeLogEnabled: true, auditEntry: "second-audit" });
        });

        it("[case] - restores outer context after nested run", () => {
            // Arrange
            const context = helpers.operationContext();

            // Act
            const { inner, outer } = context.run({ changeLogEnabled: true, auditEntry: "outer-audit" }, () => {
                const inner = context.run({ changeLogEnabled: false, auditEntry: "inner-audit" }, () => context.get());
                return { inner, outer: context.get() };
            });

            // Assert
            expect(inner).toEqual({ changeLogEnabled: false, auditEntry: "inner-audit" });
            expect(outer).toEqual({ changeLogEnabled: true, auditEntry: "outer-audit" });
        });
    });
});
