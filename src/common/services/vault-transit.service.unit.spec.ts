import { beforeAll, beforeEach, describe, expect, it, jest, afterEach } from "@jest/globals";
import { Response, fetch as Fetch } from "undici";
import { ConfigService } from "@nestjs/config";

import { Exception } from "~common/exceptions";

const fetch = jest.fn<typeof Fetch>();
const agent = jest.fn();
jest.unstable_mockModule("undici", () => ({ fetch, Agent: agent }));
let VaultTransitService: typeof import("./vault-transit.service").VaultTransitService;

const name = "tenant/key #1";
const input = "Hello 🔐";
const encodedName = encodeURIComponent(name);
const base64 = Buffer.from(input).toString("base64");
const failed = { statusCode: 502, messageKey: "services.vault.REQUEST_FAILED" };
const invalid = { statusCode: 502, messageKey: "services.vault.INVALID_SIGNATURE" };

function respond(data: unknown): void {
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({ data })));
}

function expectRequest(path: string, body?: unknown): void {
    expect(fetch).toHaveBeenLastCalledWith(`http://vault-agent/v1/transit/${path}/${encodedName}`, {
        dispatcher: expect.anything(),
        headers: { "Content-Type": "application/json" },
        ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
    });
}

describe("[CommonService] - VaultTransit", () => {
    let service: InstanceType<typeof VaultTransitService>;

    beforeAll(async () => {
        const modulePath = "./vault-transit.service";
        ({ VaultTransitService } = await import(modulePath));
    });

    beforeEach(() => {
        fetch.mockReset();
        service = new VaultTransitService(
            new ConfigService({
                VAULT_TRANSIT_MOUNT: "transit",
                VAULT_AGENT_SOCKET_PATH: "/tmp/test-vault.sock",
            }),
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("[Behavior] - key cache", () => {
        it("[case] - maps key versions and caches by name until the exact TTL boundary", async () => {
            // Arrange
            const now = jest.spyOn(Date, "now").mockReturnValue(1000);
            const key = {
                latest_version: 2,
                type: "ecdsa-p256",
                keys: {
                    "1": { creation_time: "first", public_key: "pem1" },
                    "2": { creation_time: "second", public_key: "pem2" },
                },
            };
            respond(key);

            // Act
            const result = await service.getKey({ name });
            const initialRequest = fetch.mock.calls[0];
            now.mockReturnValue(60999);
            const cachedVersion = await service.getLatestVersion({ name });
            const requestsBeforeExpiry = fetch.mock.calls.length;
            respond({ ...key, latest_version: 3 });
            const otherVersion = await service.getLatestVersion({ name: "other" });
            now.mockReturnValue(61000);
            respond({ ...key, latest_version: 4 });
            const refreshedVersion = await service.getLatestVersion({ name });

            // Assert
            expect(result).toEqual({
                name,
                type: "ecdsa-p256",
                latestVersion: 2,
                versions: [
                    { version: 1, createdAt: "first", publicKey: "pem1" },
                    { version: 2, createdAt: "second", publicKey: "pem2" },
                ],
            });
            expect(initialRequest).toEqual([
                `http://vault-agent/v1/transit/keys/${encodedName}`,
                {
                    dispatcher: expect.anything(),
                    headers: { "Content-Type": "application/json" },
                },
            ]);
            expect(cachedVersion).toBe(2);
            expect(requestsBeforeExpiry).toBe(1);
            expect(otherVersion).toBe(3);
            expect(refreshedVersion).toBe(4);
            expect(fetch).toHaveBeenCalledTimes(3);
            expect(agent).toHaveBeenCalledWith({ connect: { socketPath: "/tmp/test-vault.sock" } });
        });

        it("[case] - normalizes transport errors and does not cache failed key requests", async () => {
            // Arrange
            fetch.mockRejectedValueOnce(new Error("private socket error"));

            // Act
            const result2 = service.getKey({ name });
            await Promise.allSettled([result2]);
            respond({ latest_version: 1, type: "ecdsa-p256", keys: {} });
            const result = await service.getLatestVersion({ name });

            // Assert
            await expect(result2).rejects.toMatchObject(failed);
            expect(result).toBe(1);
            expect(fetch).toHaveBeenCalledTimes(2);
        });
    });

    describe("[Method] - encrypt", () => {
        it("[case] - encodes Unicode plaintext and maps encrypted results", async () => {
            // Arrange
            respond({ ciphertext: "vault:v2:encrypted", key_version: 2 });

            // Act
            const result = await service.encrypt({ name, plaintext: input });

            // Assert
            expect(result).toEqual({ ciphertext: "vault:v2:encrypted", version: 2 });
            expectRequest("encrypt", { plaintext: base64 });
        });

        it.each([403, 500, 503])("[case] - normalizes HTTP %s failures", async (status) => {
            // Arrange
            fetch.mockResolvedValueOnce(new Response("private upstream details", { status }));

            // Act
            const result = service.encrypt({ name, plaintext: input });

            // Assert
            await expect(result).rejects.toMatchObject(failed);
        });
    });

    describe("[Method] - decrypt", () => {
        it("[case] - decodes Unicode plaintext", async () => {
            // Arrange
            respond({ plaintext: base64 });

            // Act
            const result = await service.decrypt({ name, ciphertext: "vault:v2:encrypted" });

            // Assert
            expect(result).toBe(input);
            expectRequest("decrypt", { ciphertext: "vault:v2:encrypted" });
        });

        it("[case] - normalizes invalid JSON responses", async () => {
            // Arrange
            fetch.mockResolvedValueOnce(new Response("not json"));

            // Act
            const result = service.decrypt({ name, ciphertext: "ciphertext" });

            // Assert
            await expect(result).rejects.toMatchObject(failed);
        });
    });

    describe("[Method] - rewrap", () => {
        it("[case] - rewraps ciphertext without treating it as plaintext", async () => {
            // Arrange
            respond({ ciphertext: "vault:v3:new", key_version: 3 });

            // Act
            const result = await service.rewrap({ name, ciphertext: "vault:v2:old" });

            // Assert
            expect(result).toEqual({
                ciphertext: "vault:v3:new",
                version: 3,
            });
            expectRequest("rewrap", { ciphertext: "vault:v2:old" });
        });
    });

    describe("[Method] - sign", () => {
        it.each([undefined, 2])("[case] - signs with requested version %s", async (version) => {
            // Arrange
            respond({ signature: "vault:v2:signature", key_version: 2 });

            // Act
            const result = await service.sign({ name, input, version });

            // Assert
            expect(result).toEqual({ signature: "signature", version: 2 });
            expectRequest("sign", {
                ...(version ? { key_version: version } : {}),
                input: base64,
                marshaling_algorithm: "jws",
            });
        });

        it.each([
            { signature: "invalid", key_version: 2 },
            { signature: "vault:v2:", key_version: 2 },
            { signature: "vault:v1:signature", key_version: 2 },
            { signature: "vault:v3:signature", key_version: 3 },
        ])("[case] - rejects an invalid or inconsistent signature: $signature", async (data) => {
            // Arrange
            respond(data);

            // Act
            const result = service.sign({ name, input, version: 2 });

            // Assert
            await expect(result).rejects.toMatchObject(invalid);
        });
    });

    describe("[Method] - hmac", () => {
        it("[case] - extracts HMAC and requests SHA-256 for encoded input", async () => {
            // Arrange
            respond({ hmac: "vault:v2:hash" });

            // Act
            const result = await service.hmac({ name, input });

            // Assert
            expect(result).toBe("hash");
            expectRequest("hmac", { input: base64, algorithm: "sha2-256" });
        });

        it.each(["invalid", "vault:v1:"])("[case] - rejects malformed HMAC %s", async (hmac) => {
            // Arrange
            respond({ hmac });

            // Act
            const result = service.hmac({ name, input });

            // Assert
            await expect(result).rejects.toMatchObject(invalid);
        });
    });

    describe("[Method] - signBatch", () => {
        it("[case] - preserves batch signature order and uses one requested version", async () => {
            // Arrange
            respond({
                batch_results: [
                    { signature: "vault:v2:first", key_version: 2 },
                    { signature: "vault:v2:second", key_version: 2 },
                ],
            });

            // Act
            const result = await service.signBatch({ name, inputs: [input, "second"], version: 2 });

            // Assert
            expect(result).toEqual([
                { signature: "first", version: 2 },
                { signature: "second", version: 2 },
            ]);
            expectRequest("sign", {
                batch_input: [{ input: base64 }, { input: Buffer.from("second").toString("base64") }],
                marshaling_algorithm: "jws",
                key_version: 2,
            });
        });

        it.each([
            { signature: "bad", key_version: 2 },
            { signature: "vault:v1:wrong", key_version: 2 },
            { signature: "vault:v3:wrong", key_version: 3 },
        ])("[case] - rejects the batch if any signature is invalid: $signature", async (bad) => {
            // Arrange
            respond({ batch_results: [{ signature: "vault:v2:valid", key_version: 2 }, bad] });

            // Act
            const result = service.signBatch({ name, inputs: ["a", "b"], version: 2 });

            // Assert
            await expect(result).rejects.toMatchObject(invalid);
        });
    });

    describe("[Method] - hmacBatch", () => {
        it("[case] - preserves batch HMAC order", async () => {
            // Arrange
            respond({ batch_results: [{ hmac: "vault:v1:first" }, { hmac: "vault:v2:second" }] });

            // Act
            const result = await service.hmacBatch({ name, inputs: [input, ""] });

            // Assert
            expect(result).toEqual(["first", "second"]);
            expectRequest("hmac", { batch_input: [{ input: base64 }, { input: "" }], algorithm: "sha2-256" });
        });

        it("[case] - rejects the whole HMAC batch when a later item is malformed", async () => {
            // Arrange
            respond({ batch_results: [{ hmac: "vault:v1:valid" }, { hmac: "bad" }] });

            // Act
            const result = service.hmacBatch({ name, inputs: ["a", "b"] });

            // Assert
            await expect(result).rejects.toMatchObject(invalid);
        });
    });

    describe("[Method] - getKey", () => {
        it("[case] - preserves an already classified application exception", async () => {
            // Arrange
            const error = Exception.externalServiceFailed({ messageKey: "specific.failure" });
            fetch.mockRejectedValueOnce(error);

            // Act
            const result = service.getKey({ name });

            // Assert
            await expect(result).rejects.toBe(error);
        });
    });
});
