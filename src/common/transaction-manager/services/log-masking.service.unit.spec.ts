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

describe("[CommonService] - LogMasking", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("[Method] - normalize", () => {
        it("[case] - normalizes camelCase, snake_case and mixed case names", () => {
            // Arrange
            const { service } = helpers.service();

            // Act
            const result = service.normalize("already_snake_case");
            const result2 = service.normalize("recoveryCode");
            const result3 = service.normalize("TokenTtl");
            const result4 = service.normalize("email");

            // Assert
            expect(result).toBe("_already_snake_case_");
            expect(result2).toBe("_recovery_code_");
            expect(result3).toBe("_token_ttl_");
            expect(result4).toBe("_email_");
        });
    });

    describe("[Method] - mask", () => {
        it("[case] - masks phone numbers while preserving country code and last two digits", () => {
            // Arrange
            const { service } = helpers.service();

            // Act
            const result = service.mask("+79991234567");

            // Assert
            expect(result).toBe("+7********67");
        });

        it("[case] - masks emails while preserving the domain", () => {
            // Arrange
            const { service } = helpers.service();

            // Act
            const result = service.mask("user@example.com");

            // Assert
            expect(result).toBe("us********@example.com");
        });

        it("[case] - masks ordinary strings with a fixed replacement", () => {
            // Arrange
            const { service } = helpers.service();

            // Act
            const result = service.mask("opaque-secret");

            // Assert
            expect(result).toBe("****************");
        });

        it("[case] - does not return one-character local-part emails in clear text", () => {
            // Arrange
            const { service } = helpers.service();

            // Act
            const result = service.mask("a@example.com");

            // Assert
            expect(result).not.toBe("a@example.com");
        });
    });

    describe("[Method] - flatten", () => {
        it("[case] - collects flat sensitive strings", () => {
            // Arrange
            const { service } = helpers.service();
            const targets = helpers.auditTargets();

            // Act
            service.flatten({ node: { password: "secret" }, targets });

            // Assert
            expect(targets).toEqual([{ path: ["password"], value: "secret" }]);
        });

        it("[case] - collects nested sensitive strings with a full path", () => {
            // Arrange
            const { service } = helpers.service();
            const targets = helpers.auditTargets();

            // Act
            service.flatten({ node: { credentials: { recoveryCode: "recovery-code" } }, targets });

            // Assert
            expect(targets).toEqual([{ path: ["credentials", "recoveryCode"], value: "recovery-code" }]);
        });

        it("[case] - collects compound fields ending with sensitive names", () => {
            // Arrange
            const { service } = helpers.service();
            const targets = helpers.auditTargets();

            // Act
            service.flatten({
                node: {
                    primaryEmail: "user@example.com",
                    refreshToken: "refresh-token",
                    passwordHash: "password-hash",
                },
                targets,
            });

            // Assert
            expect(targets).toEqual([
                { path: ["primaryEmail"], value: "user@example.com" },
                { path: ["refreshToken"], value: "refresh-token" },
                { path: ["passwordHash"], value: "password-hash" },
            ]);
        });

        it("[case] - collects each string from a sensitive array", () => {
            // Arrange
            const { service } = helpers.service();
            const targets = helpers.auditTargets();

            // Act
            service.flatten({ node: { tokens: ["first-token", "second-token"] }, targets });

            // Assert
            expect(targets).toEqual([
                { path: ["tokens", 0], value: "first-token" },
                { path: ["tokens", 1], value: "second-token" },
            ]);
        });

        it("[case] - collects strings nested inside objects under a sensitive array", () => {
            // Arrange
            const { service } = helpers.service();
            const targets = helpers.auditTargets();

            // Act
            service.flatten({ node: { tokens: [{ value: "first-token" }, { value: "second-token" }] }, targets });

            // Assert
            expect(targets).toEqual([
                { path: ["tokens", 0, "value"], value: "first-token" },
                { path: ["tokens", 1, "value"], value: "second-token" },
            ]);
        });

        it("[case] - does not skip objects under sensitive keys", () => {
            // Arrange
            const { service } = helpers.service();
            const targets = helpers.auditTargets();

            // Act
            service.flatten({ node: { secret: { value: "nested-secret" } }, targets });

            // Assert
            expect(targets).toEqual([{ path: ["secret", "value"], value: "nested-secret" }]);
        });

        it("[case] - does not classify safe technical fields by sensitive substrings", () => {
            // Arrange
            const { service } = helpers.service();
            const targets = helpers.auditTargets();

            // Act
            service.flatten({
                node: {
                    hashAlgorithm: "sha256",
                    emailVerified: true,
                    tokenTtl: 3600,
                },
                targets,
            });

            // Assert
            expect(targets).toEqual([]);
        });

        it("[case] - preserves recursion through safe objects whose names contain sensitive substrings", () => {
            // Arrange
            const { service } = helpers.service();
            const targets = helpers.auditTargets();

            // Act
            service.flatten({ node: { tokenPolicy: { description: "keep for audit" } }, targets });

            // Assert
            expect(targets).toEqual([]);
        });
    });

    describe("[Method] - unflatten", () => {
        it("[case] - sets a flat value", () => {
            // Arrange
            const { service } = helpers.service();
            const node = { password: "secret" };

            // Act
            service.unflatten({ node, path: ["password"], value: "masked" });

            // Assert
            expect(node).toEqual({ password: "masked" });
        });

        it("[case] - sets a nested array value", () => {
            // Arrange
            const { service } = helpers.service();
            const node = { credentials: { tokens: ["first-token"] } };

            // Act
            service.unflatten({ node, path: ["credentials", "tokens", 0], value: "masked" });

            // Assert
            expect(node).toEqual({ credentials: { tokens: ["masked"] } });
        });

        it("[case] - ignores missing branches", () => {
            // Arrange
            const { service } = helpers.service();
            const node = { credentials: {} };

            // Act
            const act = (): unknown => service.unflatten({ node, path: ["credentials", "tokens", 0], value: "masked" });

            // Assert
            expect(act).not.toThrow();
            expect(node).toEqual({ credentials: {} });
        });
    });

    describe("[Method] - maskAuditLog", () => {
        it("[case] - does not call Vault when there are no sensitive fields", async () => {
            // Arrange
            const { service, vault } = helpers.service();
            const input = { name: "Unit Role" };

            // Act
            const result = await service.maskAuditLog({ input });

            // Assert
            expect(result).toBe(input);
            expect(vault.hmacBatch).not.toHaveBeenCalled();
        });

        it("[case] - masks sensitive values using one Vault batch", async () => {
            // Arrange
            const { service, vault } = helpers.service();

            // Act
            const result = await service.maskAuditLog({
                input: { password: "first-secret", nested: { token: "second-secret" } },
            });

            // Assert
            expect(vault.hmacBatch).toHaveBeenCalledWith({
                inputs: ["first-secret", "second-secret"],
                name: "audit-mask-key",
            });
            expect(result).toEqual({
                password: { value: "****************", hash: "hmac:first-secret" },
                nested: { token: { value: "****************", hash: "hmac:second-secret" } },
            });
        });

        it("[case] - does not mutate input when sensitive fields are masked", async () => {
            // Arrange
            const { service } = helpers.service();
            const input = { password: "first-secret" };

            // Act
            const result = await service.maskAuditLog({ input });

            // Assert
            expect(result).not.toBe(input);
            expect(input).toEqual({ password: "first-secret" });
        });

        it("[case] - does not mask false-positive technical fields", async () => {
            // Arrange
            const { service, vault } = helpers.service();
            const input = {
                hashAlgorithm: "sha256",
                tokenTtl: 3600,
                emailVerified: true,
                password: "first-secret",
            };

            // Act
            const result = await service.maskAuditLog({ input });

            // Assert
            expect(vault.hmacBatch).toHaveBeenCalledWith({ inputs: ["first-secret"], name: "audit-mask-key" });
            expect(result).toEqual({
                password: { value: "****************", hash: "hmac:first-secret" },
                hashAlgorithm: "sha256",
                emailVerified: true,
                tokenTtl: 3600,
            });
        });

        it("[case] - masks plural PII keys", async () => {
            // Arrange
            const { service, vault } = helpers.service();

            // Act
            const result = await service.maskAuditLog({
                input: {
                    emails: ["user@example.com"],
                    identities: [{ value: "passport-number" }],
                    phones: ["+79991234567"],
                },
            });

            // Assert
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

        it("[case] - preserves object structure under sensitive keys", async () => {
            // Arrange
            const { service } = helpers.service();

            // Act
            const result = await service.maskAuditLog({
                input: { secret: { value: "nested-secret", enabled: true } },
            });

            // Assert
            expect(result).toEqual({
                secret: {
                    value: { value: "****************", hash: "hmac:nested-secret" },
                    enabled: true,
                },
            });
        });

        it("[case] - masks arrays of objects through the full audit log flow", async () => {
            // Arrange
            const { service } = helpers.service();

            // Act
            const result = await service.maskAuditLog({
                input: { tokens: [{ value: "first-token" }, { value: "second-token" }] },
            });

            // Assert
            expect(result).toEqual({
                tokens: [
                    { value: { value: "****************", hash: "hmac:first-token" } },
                    { value: { value: "****************", hash: "hmac:second-token" } },
                ],
            });
        });

        it("[case] - throws when Vault returns fewer hashes than targets", async () => {
            // Arrange
            const vault = helpers.vault({ hmacBatch: () => Promise.resolve([]) });
            const { service } = helpers.service({ vault });

            // Act
            const result = service.maskAuditLog({ input: { password: "first-secret" } });

            // Assert
            await expect(result).rejects.toThrow();
        });
    });

    describe("[Method] - maskChangeLog", () => {
        it("[case] - masks old and new sensitive values independently", async () => {
            // Arrange
            const { service, vault } = helpers.service();
            const delta = new DeltaChanges({
                token: { old: "old-token", new: "new-token" },
            });

            // Act
            const result = await service.maskChangeLog({ delta });

            // Assert
            expect(vault.hmacBatch).toHaveBeenCalledWith({
                inputs: ["old-token", "new-token"],
                name: "audit-mask-key",
            });
            expect(result.token.old).toEqual({ value: "****************", hash: "hmac:old-token" });
            expect(result.token.new).toEqual({ value: "****************", hash: "hmac:new-token" });
        });

        it("[case] - masks compound fields ending with sensitive names", async () => {
            // Arrange
            const { service, vault } = helpers.service();
            const delta = new DeltaChanges({
                refreshToken: { old: "old-token", new: "new-token" },
            });

            // Act
            const result = await service.maskChangeLog({ delta });

            // Assert
            expect(vault.hmacBatch).toHaveBeenCalledWith({
                inputs: ["old-token", "new-token"],
                name: "audit-mask-key",
            });
            expect(result.refreshToken.old).toEqual({ value: "****************", hash: "hmac:old-token" });
            expect(result.refreshToken.new).toEqual({ value: "****************", hash: "hmac:new-token" });
        });

        it("[case] - preserves safe fields when sensitive fields are masked", async () => {
            // Arrange
            const { service } = helpers.service();
            const delta = new DeltaChanges({
                token: { old: "old-token", new: "new-token" },
                name: { old: "Old Name", new: "New Name" },
            });

            // Act
            const result = await service.maskChangeLog({ delta });

            // Assert
            expect(result).not.toBe(delta);
            expect(result.name).toEqual({ old: "Old Name", new: "New Name" });
            expect(result.token.old).toEqual({ value: "****************", hash: "hmac:old-token" });
            expect(result.token.new).toEqual({ value: "****************", hash: "hmac:new-token" });
        });

        it("[case] - masks only string sides of sensitive changes", async () => {
            // Arrange
            const { service, vault } = helpers.service();
            const delta = new DeltaChanges({
                token: { old: null, new: "new-token" },
                password: { old: "old-password", new: null },
            });

            // Act
            const result = await service.maskChangeLog({ delta });

            // Assert
            expect(vault.hmacBatch).toHaveBeenCalledWith({
                inputs: ["new-token", "old-password"],
                name: "audit-mask-key",
            });
            expect(result.token.old).toBeNull();
            expect(result.token.new).toEqual({ value: "****************", hash: "hmac:new-token" });
            expect(result.password.old).toEqual({ value: "****************", hash: "hmac:old-password" });
            expect(result.password.new).toBeNull();
        });

        it("[case] - does not call Vault when delta has no sensitive fields", async () => {
            // Arrange
            const { service, vault } = helpers.service();
            const delta = new DeltaChanges({ name: { old: "Old Name", new: "New Name" } });

            // Act
            const result = await service.maskChangeLog({ delta });

            // Assert
            expect(result).toBe(delta);
            expect(vault.hmacBatch).not.toHaveBeenCalled();
        });

        it("[case] - does not mask false-positive technical fields", async () => {
            // Arrange
            const { service, vault } = helpers.service();
            const delta = new DeltaChanges({
                hashAlgorithm: { old: "sha1", new: "sha256" },
                tokenTtl: { old: 300, new: 3600 },
            });

            // Act
            const result = await service.maskChangeLog({ delta });

            // Assert
            expect(result).toBe(delta);
            expect(vault.hmacBatch).not.toHaveBeenCalled();
        });
    });

    describe("[Method] - sign", () => {
        it("[case] - passes Vault key version through", async () => {
            // Arrange
            const { service } = helpers.service({
                vault: helpers.vault({ sign: () => Promise.resolve({ signature: "vault-signature", version: 7 }) }),
            });

            // Act
            const result = await service.sign({ entity: createAuditLog({ input: { name: "Unit Role" } }) });

            // Assert
            expect(result).toEqual({
                signature: "vault-signature",
                keyVersion: 7,
            });
        });

        it("[case] - covers nested audit input", async () => {
            // Arrange
            const { service } = helpers.service();
            const first = await service.sign({ entity: createAuditLog({ input: { name: "First" } }) });

            // Act
            const second = await service.sign({ entity: createAuditLog({ input: { name: "Second" } }) });

            // Assert
            expect(first.signature).not.toBe(second.signature);
        });

        it("[case] - covers nested change delta", async () => {
            // Arrange
            const { service } = helpers.service();
            const first = await service.sign({
                entity: createChangeLog({ delta: new DeltaChanges({ name: { old: "Old", new: "First" } }) }),
            });

            // Act
            const second = await service.sign({
                entity: createChangeLog({ delta: new DeltaChanges({ name: { old: "Old", new: "Second" } }) }),
            });

            // Assert
            expect(first.signature).not.toBe(second.signature);
        });

        it("[case] - reproduces the signature after signing", async () => {
            // Arrange
            const { service } = helpers.service();
            const entity = createAuditLog({ input: { name: "Unit Role" } });
            const first = await service.sign({ entity });
            entity.sign(first);

            // Act
            const second = await service.sign({ entity });

            // Assert
            expect(second).toEqual(first);
        });

        it("[case] - uses a canonical key order for equivalent payloads", async () => {
            // Arrange
            const { service } = helpers.service();
            const first = await service.sign({ entity: createAuditLog({ input: { first: "1", second: "2" } }) });

            // Act
            const second = await service.sign({ entity: createAuditLog({ input: { second: "2", first: "1" } }) });

            // Assert
            expect(second).toEqual(first);
        });
    });
});
