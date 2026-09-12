import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { LogMaskingUnitHelpers } from "~testing/unit/transaction-manager/log-masking.helpers";
import { ChangeLog, AuditLog } from "~common/transaction-manager/entities";
import { DeltaChanges } from "~common/transaction-manager/value-objects";
import { ActionType, EntityType } from "~context/enums";

/* eslint-disable prettier/prettier */
const AUDIT_ID  = "00000000-0000-4000-8000-000000000001";
const CHANGE_ID = "00000000-0000-4000-8000-000000000002";
/* eslint-enable prettier/prettier */

const CREATED_AT = new Date("2026-09-12T12:00:00.000Z");

const helpers = new LogMaskingUnitHelpers();

function createAuditLog(props: Partial<AuditLog>): AuditLog {
    return helpers.createAuditLog({
        actionType: ActionType.CREATE,
        entityType: EntityType.ROLE,
        createdAt: CREATED_AT,
        id: AUDIT_ID,
        ...props,
    });
}

function createChangeLog(props: Partial<ChangeLog>): ChangeLog {
    return helpers.createChangeLog({
        createdAt: CREATED_AT,
        id: CHANGE_ID,
        ...props,
    });
}

describe("LogMaskingService", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("normalize", () => {
        it("normalizes camelCase, snake_case and mixed case names", () => {
            const { service } = helpers.service();

            expect(service.normalize("already_snake_case")).toBe("_already_snake_case_");
            expect(service.normalize("recoveryCode")).toBe("_recovery_code_");
            expect(service.normalize("TokenTtl")).toBe("_token_ttl_");
            expect(service.normalize("email")).toBe("_email_");
        });
    });

    describe("mask", () => {
        it("masks phone numbers while preserving country code and last two digits", () => {
            const { service } = helpers.service();

            expect(service.mask("+79991234567")).toBe("+7********67");
        });

        it("masks emails while preserving the domain", () => {
            const { service } = helpers.service();

            expect(service.mask("user@example.com")).toBe("us********@example.com");
        });

        it("masks ordinary strings with a fixed replacement", () => {
            const { service } = helpers.service();

            expect(service.mask("opaque-secret")).toBe("****************");
        });

        it("does not return one-character local-part emails in clear text", () => {
            const { service } = helpers.service();

            expect(service.mask("a@example.com")).not.toBe("a@example.com");
        });
    });

    describe("flatten", () => {
        it("collects flat sensitive strings", () => {
            const { service } = helpers.service();
            const targets = helpers.auditTargets();

            service.flatten({ node: { password: "secret" }, targets });

            expect(targets).toEqual([{ path: ["password"], value: "secret" }]);
        });

        it("collects nested sensitive strings with a full path", () => {
            const { service } = helpers.service();
            const targets = helpers.auditTargets();

            service.flatten({ node: { credentials: { recoveryCode: "recovery-code" } }, targets });

            expect(targets).toEqual([{ path: ["credentials", "recoveryCode"], value: "recovery-code" }]);
        });

        it("collects compound fields ending with sensitive names", () => {
            const { service } = helpers.service();
            const targets = helpers.auditTargets();

            service.flatten({
                node: {
                    primaryEmail: "user@example.com",
                    refreshToken: "refresh-token",
                    passwordHash: "password-hash",
                },
                targets,
            });

            expect(targets).toEqual([
                { path: ["primaryEmail"], value: "user@example.com" },
                { path: ["refreshToken"], value: "refresh-token" },
                { path: ["passwordHash"], value: "password-hash" },
            ]);
        });

        it("collects each string from a sensitive array", () => {
            const { service } = helpers.service();
            const targets = helpers.auditTargets();

            service.flatten({ node: { tokens: ["first-token", "second-token"] }, targets });

            expect(targets).toEqual([
                { path: ["tokens", 0], value: "first-token" },
                { path: ["tokens", 1], value: "second-token" },
            ]);
        });

        it("collects strings nested inside objects under a sensitive array", () => {
            const { service } = helpers.service();
            const targets = helpers.auditTargets();

            service.flatten({ node: { tokens: [{ value: "first-token" }, { value: "second-token" }] }, targets });

            expect(targets).toEqual([
                { path: ["tokens", 0, "value"], value: "first-token" },
                { path: ["tokens", 1, "value"], value: "second-token" },
            ]);
        });

        it("does not skip objects under sensitive keys", () => {
            const { service } = helpers.service();
            const targets = helpers.auditTargets();

            service.flatten({ node: { secret: { value: "nested-secret" } }, targets });

            expect(targets).toEqual([{ path: ["secret", "value"], value: "nested-secret" }]);
        });

        it("does not classify safe technical fields by sensitive substrings", () => {
            const { service } = helpers.service();
            const targets = helpers.auditTargets();

            service.flatten({
                node: {
                    hashAlgorithm: "sha256",
                    emailVerified: true,
                    tokenTtl: 3600,
                },
                targets,
            });

            expect(targets).toEqual([]);
        });

        it("preserves recursion through safe objects whose names contain sensitive substrings", () => {
            const { service } = helpers.service();
            const targets = helpers.auditTargets();

            service.flatten({ node: { tokenPolicy: { description: "keep for audit" } }, targets });

            expect(targets).toEqual([]);
        });
    });

    describe("unflatten", () => {
        it("sets a flat value", () => {
            const { service } = helpers.service();
            const node = { password: "secret" };

            service.unflatten({ node, path: ["password"], value: "masked" });

            expect(node).toEqual({ password: "masked" });
        });

        it("sets a nested array value", () => {
            const { service } = helpers.service();
            const node = { credentials: { tokens: ["first-token"] } };

            service.unflatten({ node, path: ["credentials", "tokens", 0], value: "masked" });

            expect(node).toEqual({ credentials: { tokens: ["masked"] } });
        });

        it("ignores missing branches", () => {
            const { service } = helpers.service();
            const node = { credentials: {} };

            expect(() => service.unflatten({ node, path: ["credentials", "tokens", 0], value: "masked" })).not.toThrow();
            expect(node).toEqual({ credentials: {} });
        });
    });

    describe("maskAuditLog", () => {
        it("does not call Vault when there are no sensitive fields", async () => {
            const { service, vault } = helpers.service();
            const input = { name: "Unit Role" };

            await expect(service.maskAuditLog({ input })).resolves.toBe(input);
            expect(vault.hmacBatch).not.toHaveBeenCalled();
        });

        it("masks sensitive values using one Vault batch", async () => {
            const { service, vault } = helpers.service();

            const result = await service.maskAuditLog({
                input: { password: "first-secret", nested: { token: "second-secret" } },
            });

            expect(vault.hmacBatch).toHaveBeenCalledWith({
                inputs: ["first-secret", "second-secret"],
                name: "audit-mask-key",
            });
            expect(result).toEqual({
                password: { value: "****************", hash: "hmac:first-secret" },
                nested: { token: { value: "****************", hash: "hmac:second-secret" } },
            });
        });

        it("does not mutate input when sensitive fields are masked", async () => {
            const { service } = helpers.service();
            const input = { password: "first-secret" };

            const result = await service.maskAuditLog({ input });

            expect(result).not.toBe(input);
            expect(input).toEqual({ password: "first-secret" });
        });

        it("does not mask false-positive technical fields", async () => {
            const { service, vault } = helpers.service();
            const input = {
                hashAlgorithm: "sha256",
                tokenTtl: 3600,
                emailVerified: true,
                password: "first-secret",
            };

            const result = await service.maskAuditLog({ input });

            expect(vault.hmacBatch).toHaveBeenCalledWith({ inputs: ["first-secret"], name: "audit-mask-key" });
            expect(result).toEqual({
                password: { value: "****************", hash: "hmac:first-secret" },
                hashAlgorithm: "sha256",
                emailVerified: true,
                tokenTtl: 3600,
            });
        });

        it("masks plural PII keys", async () => {
            const { service, vault } = helpers.service();

            const result = await service.maskAuditLog({
                input: {
                    emails: ["user@example.com"],
                    identities: [{ value: "passport-number" }],
                    phones: ["+79991234567"],
                },
            });

            expect(vault.hmacBatch).toHaveBeenCalledWith({
                inputs: ["user@example.com", "passport-number", "+79991234567"],
                name: "audit-mask-key",
            });
            expect(result).toEqual({
                emails: [{ value: "us********@example.com", hash: "hmac:user@example.com" }],
                identities: [{ value: { value: "****************", hash: "hmac:passport-number" } }],
                phones: [{ value: "+7********67", hash: "hmac:+79991234567" }],
            });
        });

        it("preserves object structure under sensitive keys", async () => {
            const { service } = helpers.service();

            const result = await service.maskAuditLog({
                input: { secret: { value: "nested-secret", enabled: true } },
            });

            expect(result).toEqual({
                secret: {
                    value: { value: "****************", hash: "hmac:nested-secret" },
                    enabled: true,
                },
            });
        });

        it("masks arrays of objects through the full audit log flow", async () => {
            const { service } = helpers.service();

            const result = await service.maskAuditLog({
                input: { tokens: [{ value: "first-token" }, { value: "second-token" }] },
            });

            expect(result).toEqual({
                tokens: [
                    { value: { value: "****************", hash: "hmac:first-token" } },
                    { value: { value: "****************", hash: "hmac:second-token" } },
                ],
            });
        });

        it("throws when Vault returns fewer hashes than targets", async () => {
            const vault = helpers.vault({ hmacBatch: () => Promise.resolve([]) });
            const { service } = helpers.service({ vault });

            await expect(service.maskAuditLog({ input: { password: "first-secret" } })).rejects.toThrow();
        });
    });

    describe("maskChangeLog", () => {
        it("masks old and new sensitive values independently", async () => {
            const { service, vault } = helpers.service();
            const delta = new DeltaChanges({
                token: { old: "old-token", new: "new-token" },
            });

            const result = await service.maskChangeLog({ delta });

            expect(vault.hmacBatch).toHaveBeenCalledWith({
                inputs: ["old-token", "new-token"],
                name: "audit-mask-key",
            });
            expect(result.token.old).toEqual({ value: "****************", hash: "hmac:old-token" });
            expect(result.token.new).toEqual({ value: "****************", hash: "hmac:new-token" });
        });

        it("masks compound fields ending with sensitive names", async () => {
            const { service, vault } = helpers.service();
            const delta = new DeltaChanges({
                refreshToken: { old: "old-token", new: "new-token" },
            });

            const result = await service.maskChangeLog({ delta });

            expect(vault.hmacBatch).toHaveBeenCalledWith({
                inputs: ["old-token", "new-token"],
                name: "audit-mask-key",
            });
            expect(result.refreshToken.old).toEqual({ value: "****************", hash: "hmac:old-token" });
            expect(result.refreshToken.new).toEqual({ value: "****************", hash: "hmac:new-token" });
        });

        it("preserves safe fields when sensitive fields are masked", async () => {
            const { service } = helpers.service();
            const delta = new DeltaChanges({
                token: { old: "old-token", new: "new-token" },
                name: { old: "Old Name", new: "New Name" },
            });

            const result = await service.maskChangeLog({ delta });

            expect(result).not.toBe(delta);
            expect(result.name).toEqual({ old: "Old Name", new: "New Name" });
            expect(result.token.old).toEqual({ value: "****************", hash: "hmac:old-token" });
            expect(result.token.new).toEqual({ value: "****************", hash: "hmac:new-token" });
        });

        it("masks only string sides of sensitive changes", async () => {
            const { service, vault } = helpers.service();
            const delta = new DeltaChanges({
                token: { old: null, new: "new-token" },
                password: { old: "old-password", new: null },
            });

            const result = await service.maskChangeLog({ delta });

            expect(vault.hmacBatch).toHaveBeenCalledWith({
                inputs: ["new-token", "old-password"],
                name: "audit-mask-key",
            });
            expect(result.token.old).toBeNull();
            expect(result.token.new).toEqual({ value: "****************", hash: "hmac:new-token" });
            expect(result.password.old).toEqual({ value: "****************", hash: "hmac:old-password" });
            expect(result.password.new).toBeNull();
        });

        it("does not call Vault when delta has no sensitive fields", async () => {
            const { service, vault } = helpers.service();
            const delta = new DeltaChanges({ name: { old: "Old Name", new: "New Name" } });

            await expect(service.maskChangeLog({ delta })).resolves.toBe(delta);
            expect(vault.hmacBatch).not.toHaveBeenCalled();
        });

        it("does not mask false-positive technical fields", async () => {
            const { service, vault } = helpers.service();
            const delta = new DeltaChanges({
                hashAlgorithm: { old: "sha1", new: "sha256" },
                tokenTtl: { old: 300, new: 3600 },
            });

            const result = await service.maskChangeLog({ delta });

            expect(result).toBe(delta);
            expect(vault.hmacBatch).not.toHaveBeenCalled();
        });
    });

    describe("sign", () => {
        it("passes Vault key version through", async () => {
            const { service } = helpers.service({
                vault: helpers.vault({ sign: () => Promise.resolve({ signature: "vault-signature", version: 7 }) }),
            });

            await expect(service.sign({ entity: createAuditLog({ input: { name: "Unit Role" } }) })).resolves.toEqual({
                signature: "vault-signature",
                keyVersion: 7,
            });
        });

        it("covers nested audit input", async () => {
            const { service } = helpers.service();
            const first = await service.sign({ entity: createAuditLog({ input: { name: "First" } }) });
            const second = await service.sign({ entity: createAuditLog({ input: { name: "Second" } }) });

            expect(first.signature).not.toBe(second.signature);
        });

        it("covers nested change delta", async () => {
            const { service } = helpers.service();
            const first = await service.sign({
                entity: createChangeLog({ delta: new DeltaChanges({ name: { old: "Old", new: "First" } }) }),
            });
            const second = await service.sign({
                entity: createChangeLog({ delta: new DeltaChanges({ name: { old: "Old", new: "Second" } }) }),
            });

            expect(first.signature).not.toBe(second.signature);
        });

        it("is reproducible after the entity has been signed", async () => {
            const { service } = helpers.service();
            const entity = createAuditLog({ input: { name: "Unit Role" } });
            const first = await service.sign({ entity });
            entity.sign(first);
            const second = await service.sign({ entity });

            expect(second).toEqual(first);
        });

        it("uses a canonical key order for equivalent payloads", async () => {
            const { service } = helpers.service();
            const first = await service.sign({ entity: createAuditLog({ input: { first: "1", second: "2" } }) });
            const second = await service.sign({ entity: createAuditLog({ input: { second: "2", first: "1" } }) });

            expect(second).toEqual(first);
        });
    });
});
