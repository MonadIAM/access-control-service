import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ConfigService } from "@nestjs/config";
import * as jose from "jose";

const remoteKeys = jest.fn<(...args: Parameters<typeof jose.createRemoteJWKSet>) => jose.JWTVerifyGetKey>();
jest.unstable_mockModule("jose", () => ({ ...jose, createRemoteJWKSet: remoteKeys }));
let JWTService: typeof import("./jwt.service").JWTService;

const issuer = "https://issuer.example";
const claims: jose.JWTPayload = {
    client_id: "client",
    sub: "subject",
    sid: "session",
    jti: "token-id",
    iss: issuer,
    aud: `${issuer}:api`,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
};

describe("JWTService", () => {
    let service: InstanceType<typeof JWTService>;
    let keys: Awaited<ReturnType<typeof jose.generateKeyPair>>;

    beforeAll(async () => {
        const modulePath = "./jwt.service";
        ({ JWTService } = await import(modulePath));
        keys = await jose.generateKeyPair("ES256");
        const jwk = await jose.exportJWK(keys.publicKey);
        remoteKeys.mockReturnValue(jose.createLocalJWKSet({ keys: [{ ...jwk, kid: "test-key" }] }));
    });

    beforeEach(() => {
        service = new JWTService(
            new ConfigService({
                JWT_JWKS_URL: `${issuer}/jwks`,
                JWT_JWKS_COOLDOWN_DURATION: "5s",
                JWT_JWKS_TIMEOUT_DURATION: "2s",
                JWT_JWKS_CACHE_MAX_AGE: "10m",
                JWT_ISSUER: issuer,
            }),
        );
        service.onModuleInit();
    });

    function sign(payload: jose.JWTPayload, typ = "at+jwt"): Promise<string> {
        return new jose.SignJWT(payload).setProtectedHeader({ alg: "ES256", kid: "test-key", typ }).sign(keys.privateKey);
    }

    async function expectInvalid(token: string): Promise<void> {
        await expect(service.verifyAccess({ token })).rejects.toMatchObject({
            statusCode: 401,
            messageKey: "services.jwt.INVALID_ACCESS_TOKEN",
            headers: { "WWW-Authenticate": 'Bearer error="invalid_token"' },
        });
    }

    describe("verifyAccess", () => {
        it("configures key discovery durations in milliseconds and returns verified claims", async () => {
            const token = await sign(claims);

            const result = await service.verifyAccess({ token });

            expect(remoteKeys).toHaveBeenCalledWith(new URL(`${issuer}/jwks`), {
                cooldownDuration: 5000,
                timeoutDuration: 2000,
                cacheMaxAge: 600000,
            });
            expect(result).toEqual(claims);
        });

        it.each(["client_id", "sub", "sid", "exp", "iat", "jti"])("requires the %s claim", async (claim) => {
            const payload = { ...claims };
            delete payload[claim];

            await expectInvalid(await sign(payload));
        });

        it.each([
            { iss: "https://other.example" },
            { aud: "other-api" },
            { exp: 1 },
            { nbf: Math.floor(Date.now() / 1000) + 3600 },
        ])("rejects invalid token claims %j", async (override) => {
            await expectInvalid(await sign({ ...claims, ...override }));
        });

        it("rejects a token with a different type", async () => {
            await expectInvalid(await sign(claims, "JWT"));
        });

        it("rejects a signature from an untrusted key", async () => {
            const other = await jose.generateKeyPair("ES256");
            const token = await new jose.SignJWT(claims)
                .setProtectedHeader({ alg: "ES256", kid: "test-key", typ: "at+jwt" })
                .sign(other.privateKey);

            await expectInvalid(token);
        });

        it("rejects an otherwise correctly signed token using a different algorithm", async () => {
            const token = await new jose.SignJWT(claims)
                .setProtectedHeader({ alg: "HS256", typ: "at+jwt" })
                .sign(new Uint8Array(32));

            await expectInvalid(token);
        });

        it("normalizes malformed tokens", async () => {
            await expectInvalid("not.a.jwt");
        });
    });

    describe("onModuleInit", () => {
        it("normalizes key resolution failures", async () => {
            remoteKeys.mockReturnValueOnce(() => Promise.reject(new Error("private network failure")));
            service.onModuleInit();

            await expectInvalid(await sign(claims));
        });
    });
});
