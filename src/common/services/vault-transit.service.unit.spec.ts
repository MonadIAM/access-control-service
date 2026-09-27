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

describe("VaultTransitService", () => {
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

    describe("getKey / getLatestVersion", () => {
        it("maps key versions and caches by name until the exact TTL boundary", async () => {
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

            const result = await service.getKey({ name });

            expect(result).toEqual({
                name,
                type: "ecdsa-p256",
                latestVersion: 2,
                versions: [
                    { version: 1, createdAt: "first", publicKey: "pem1" },
                    { version: 2, createdAt: "second", publicKey: "pem2" },
                ],
            });
            expectRequest("keys");

            now.mockReturnValue(60999);

            const cachedVersion = await service.getLatestVersion({ name });

            expect(cachedVersion).toBe(2);
            expect(fetch).toHaveBeenCalledTimes(1);

            respond({ ...key, latest_version: 3 });

            const otherVersion = await service.getLatestVersion({ name: "other" });

            expect(otherVersion).toBe(3);

            now.mockReturnValue(61000);
            respond({ ...key, latest_version: 4 });

            const refreshedVersion = await service.getLatestVersion({ name });

            expect(refreshedVersion).toBe(4);
            expect(fetch).toHaveBeenCalledTimes(3);
            expect(agent).toHaveBeenCalledWith({ connect: { socketPath: "/tmp/test-vault.sock" } });
        });

        it("normalizes transport errors and does not cache failed key requests", async () => {
            fetch.mockRejectedValueOnce(new Error("private socket error"));

            await expect(service.getKey({ name })).rejects.toMatchObject(failed);

            respond({ latest_version: 1, type: "ecdsa-p256", keys: {} });

            const result = await service.getLatestVersion({ name });

            expect(result).toBe(1);
            expect(fetch).toHaveBeenCalledTimes(2);
        });
    });

    describe("encrypt", () => {
        it("encodes Unicode plaintext and maps encrypted results", async () => {
            respond({ ciphertext: "vault:v2:encrypted", key_version: 2 });

            const result = await service.encrypt({ name, plaintext: input });

            expect(result).toEqual({ ciphertext: "vault:v2:encrypted", version: 2 });
            expectRequest("encrypt", { plaintext: base64 });
        });

        it.each([403, 500, 503])("normalizes HTTP %s failures", async (status) => {
            fetch.mockResolvedValueOnce(new Response("private upstream details", { status }));

            await expect(service.encrypt({ name, plaintext: input })).rejects.toMatchObject(failed);
        });
    });

    describe("decrypt", () => {
        it("decodes Unicode plaintext", async () => {
            respond({ plaintext: base64 });

            const result = await service.decrypt({ name, ciphertext: "vault:v2:encrypted" });

            expect(result).toBe(input);
            expectRequest("decrypt", { ciphertext: "vault:v2:encrypted" });
        });

        it("normalizes invalid JSON responses", async () => {
            fetch.mockResolvedValueOnce(new Response("not json"));

            await expect(service.decrypt({ name, ciphertext: "ciphertext" })).rejects.toMatchObject(failed);
        });
    });

    describe("rewrap", () => {
        it("rewraps ciphertext without treating it as plaintext", async () => {
            respond({ ciphertext: "vault:v3:new", key_version: 3 });

            const result = await service.rewrap({ name, ciphertext: "vault:v2:old" });

            expect(result).toEqual({
                ciphertext: "vault:v3:new",
                version: 3,
            });
            expectRequest("rewrap", { ciphertext: "vault:v2:old" });
        });
    });

    describe("sign", () => {
        it.each([undefined, 2])("signs with requested version %s", async (version) => {
            respond({ signature: "vault:v2:signature", key_version: 2 });

            const result = await service.sign({ name, input, version });

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
        ])("rejects an invalid or inconsistent signature: $signature", async (data) => {
            respond(data);

            await expect(service.sign({ name, input, version: 2 })).rejects.toMatchObject(invalid);
        });
    });

    describe("hmac", () => {
        it("extracts HMAC and requests SHA-256 for encoded input", async () => {
            respond({ hmac: "vault:v2:hash" });

            const result = await service.hmac({ name, input });

            expect(result).toBe("hash");
            expectRequest("hmac", { input: base64, algorithm: "sha2-256" });
        });

        it.each(["invalid", "vault:v1:"])("rejects malformed HMAC %s", async (hmac) => {
            respond({ hmac });

            await expect(service.hmac({ name, input })).rejects.toMatchObject(invalid);
        });
    });

    describe("signBatch", () => {
        it("preserves batch signature order and uses one requested version", async () => {
            respond({
                batch_results: [
                    { signature: "vault:v2:first", key_version: 2 },
                    { signature: "vault:v2:second", key_version: 2 },
                ],
            });

            const result = await service.signBatch({ name, inputs: [input, "second"], version: 2 });

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
        ])("rejects the batch if any signature is invalid: $signature", async (bad) => {
            respond({ batch_results: [{ signature: "vault:v2:valid", key_version: 2 }, bad] });

            await expect(service.signBatch({ name, inputs: ["a", "b"], version: 2 })).rejects.toMatchObject(invalid);
        });
    });

    describe("hmacBatch", () => {
        it("preserves batch HMAC order", async () => {
            respond({ batch_results: [{ hmac: "vault:v1:first" }, { hmac: "vault:v2:second" }] });

            const result = await service.hmacBatch({ name, inputs: [input, ""] });

            expect(result).toEqual(["first", "second"]);
            expectRequest("hmac", { batch_input: [{ input: base64 }, { input: "" }], algorithm: "sha2-256" });
        });

        it("rejects the whole HMAC batch when a later item is malformed", async () => {
            respond({ batch_results: [{ hmac: "vault:v1:valid" }, { hmac: "bad" }] });

            await expect(service.hmacBatch({ name, inputs: ["a", "b"] })).rejects.toMatchObject(invalid);
        });
    });

    describe("getKey", () => {
        it("preserves an already classified application exception", async () => {
            const error = Exception.externalServiceFailed({ messageKey: "specific.failure" });
            fetch.mockRejectedValueOnce(error);

            await expect(service.getKey({ name })).rejects.toBe(error);
        });
    });
});
