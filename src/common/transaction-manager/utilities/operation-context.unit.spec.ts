import { describe, expect, it } from "@jest/globals";

import { OperationContextUnitHelpers } from "~testing/unit/transaction-manager/operation-context.helpers";

const helpers = new OperationContextUnitHelpers();

describe("OperationContext", () => {
    describe("get", () => {
        it("returns undefined outside run", () => {
            const context = helpers.operationContext();

            expect(context.get()).toBeUndefined();
        });
    });

    describe("run", () => {
        it("exposes context synchronously inside run", () => {
            const context = helpers.operationContext();

            context.run({ changeLogEnabled: true, auditEntry: "audit-entry" }, () => {
                expect(context.get()).toEqual({ changeLogEnabled: true, auditEntry: "audit-entry" });
            });
        });

        it("preserves context across awaits", async () => {
            const context = helpers.operationContext();

            await context.run({ changeLogEnabled: true, auditEntry: "audit-entry" }, async () => {
                await Promise.resolve();

                expect(context.get()).toEqual({ changeLogEnabled: true, auditEntry: "audit-entry" });
            });
        });

        it("isolates parallel runs", async () => {
            const context = helpers.operationContext();

            await Promise.all([
                context.run({ changeLogEnabled: true, auditEntry: "first-audit" }, async () => {
                    await Promise.resolve();
                    expect(context.get()).toEqual({ changeLogEnabled: true, auditEntry: "first-audit" });
                }),
                context.run({ changeLogEnabled: true, auditEntry: "second-audit" }, async () => {
                    await Promise.resolve();
                    expect(context.get()).toEqual({ changeLogEnabled: true, auditEntry: "second-audit" });
                }),
            ]);
        });

        it("restores outer context after nested run", () => {
            const context = helpers.operationContext();

            context.run({ changeLogEnabled: true, auditEntry: "outer-audit" }, () => {
                context.run({ changeLogEnabled: false, auditEntry: "inner-audit" }, () => {
                    expect(context.get()).toEqual({ changeLogEnabled: false, auditEntry: "inner-audit" });
                });

                expect(context.get()).toEqual({ changeLogEnabled: true, auditEntry: "outer-audit" });
            });
        });
    });
});
