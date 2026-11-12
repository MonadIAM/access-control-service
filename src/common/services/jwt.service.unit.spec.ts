import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ConfigService } from "@nestjs/config";
import * as jose from "jose";

const remoteKeys = jest.fn<typeof jose.createRemoteJWKSet>();
const fetchKeys = jest.fn<typeof fetch>();
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

describe("[CommonService] - JWT", () => {
    let service: InstanceType<typeof JWTService>;
    let keys: Awaited<ReturnType<typeof jose.generateKeyPair>>;
    let publicKeys: jose.JSONWebKeySet;

    beforeAll(async () => {
        const modulePath = "./jwt.service";
        ({ JWTService } = await import(modulePath));
        keys = await jose.generateKeyPair("ES256");
        const jwk = await jose.exportJWK(keys.publicKey);
        publicKeys = { keys: [{ ...jwk, kid: "test-key" }] };
        remoteKeys.mockImplementation((url, options) =>
            jose.createRemoteJWKSet(url, { ...options, [jose.customFetch]: fetchKeys }),
        );
    });

    beforeEach(async () => {
        fetchKeys.mockImplementation(() => Promise.resolve(Response.json(publicKeys)));
        service = new JWTService(
            new ConfigService({
                JWT_JWKS_URL: `${issuer}/jwks`,
                JWT_JWKS_COOLDOWN_DURATION: "5s",
                JWT_JWKS_TIMEOUT_DURATION: "2s",
                JWT_JWKS_CACHE_MAX_AGE: "10m",
                JWT_ISSUER: issuer,
            }),
        );
        await service.onModuleInit();
    });

    function sign(payload: jose.JWTPayload, typ = "at+jwt"): Promise<string> {
        return new jose.SignJWT(payload).setProtectedHeader({ alg: "ES256", kid: "test-key", typ }).sign(keys.privateKey);
    }

    describe("[Method] - verifyAccess", () => {
        it("[case] - configures key discovery durations in milliseconds and returns verified claims", async () => {
            // Arrange
            const token = await sign(claims);

            // Act
            const result = await service.verifyAccess({ token });

            // Assert
            expect(remoteKeys).toHaveBeenCalledWith(new URL(`${issuer}/jwks`), {
                cooldownDuration: 5000,
                timeoutDuration: 2000,
                cacheMaxAge: 600000,
            });
            expect(result).toEqual(claims);
        });

        it.each(["client_id", "sub", "sid", "exp", "iat", "jti"])("[case] - requires the %s claim", async (claim) => {
            // Arrange
            const payload = { ...claims };
            delete payload[claim];
            const invalidToken = await sign(payload);

            // Act
            const result = service.verifyAccess({ token: invalidToken });

            // Assert
            await expect(result).rejects.toMatchObject({
                statusCode: 401,
                messageKey: "services.jwt.INVALID_ACCESS_TOKEN",
                headers: { "WWW-Authenticate": 'Bearer error="invalid_token"' },
            });
        });

        it.each([
            { label: "issuer", value: { iss: "https://other.example" } },
            { label: "audience", value: { aud: "other-api" } },
            { label: "expiration", value: { exp: 1 } },
            { label: "not before", value: { nbf: Math.floor(Date.now() / 1000) + 3600 } },
        ])("[case] - rejects invalid token claims ($label)", async ({ value: override }) => {
            // Arrange
            const invalidToken = await sign({ ...claims, ...override });

            // Act
            const result = service.verifyAccess({ token: invalidToken });

            // Assert
            await expect(result).rejects.toMatchObject({
                statusCode: 401,
                messageKey: "services.jwt.INVALID_ACCESS_TOKEN",
                headers: { "WWW-Authenticate": 'Bearer error="invalid_token"' },
            });
        });

        it("[case] - rejects a token with a different type", async () => {
            // Arrange
            const invalidToken = await sign(claims, "JWT");

            // Act
            const result = service.verifyAccess({ token: invalidToken });

            // Assert
            await expect(result).rejects.toMatchObject({
                statusCode: 401,
                messageKey: "services.jwt.INVALID_ACCESS_TOKEN",
                headers: { "WWW-Authenticate": 'Bearer error="invalid_token"' },
            });
        });

        it("[case] - rejects a signature from an untrusted key", async () => {
            // Arrange
            const other = await jose.generateKeyPair("ES256");
            const token = await new jose.SignJWT(claims)
                .setProtectedHeader({ alg: "ES256", kid: "test-key", typ: "at+jwt" })
                .sign(other.privateKey);
            const invalidToken = token;

            // Act
            const result = service.verifyAccess({ token: invalidToken });

            // Assert
            await expect(result).rejects.toMatchObject({
                statusCode: 401,
                messageKey: "services.jwt.INVALID_ACCESS_TOKEN",
                headers: { "WWW-Authenticate": 'Bearer error="invalid_token"' },
            });
        });

        it("[case] - rejects an otherwise correctly signed token using a different algorithm", async () => {
            // Arrange
            const token = await new jose.SignJWT(claims)
                .setProtectedHeader({ alg: "HS256", typ: "at+jwt" })
                .sign(new Uint8Array(32));
            const invalidToken = token;

            // Act
            const result = service.verifyAccess({ token: invalidToken });

            // Assert
            await expect(result).rejects.toMatchObject({
                statusCode: 401,
                messageKey: "services.jwt.INVALID_ACCESS_TOKEN",
                headers: { "WWW-Authenticate": 'Bearer error="invalid_token"' },
            });
        });

        it("[case] - normalizes malformed tokens", async () => {
            // Arrange
            const invalidToken = "not.a.jwt";

            // Act
            const result = service.verifyAccess({ token: invalidToken });

            // Assert
            await expect(result).rejects.toMatchObject({
                statusCode: 401,
                messageKey: "services.jwt.INVALID_ACCESS_TOKEN",
                headers: { "WWW-Authenticate": 'Bearer error="invalid_token"' },
            });
        });
    });

    describe("[Method] - onModuleInit", () => {
        it("[case] - loads verification keys before the first token", async () => {
            // Arrange
            const token = await sign(claims);
            fetchKeys.mockClear();

            // Act
            const result = await service.verifyAccess({ token });

            // Assert
            expect(result).toEqual(claims);
            expect(fetchKeys).not.toHaveBeenCalled();
        });

        it("[case] - fails initialization when verification keys cannot be loaded", async () => {
            // Arrange
            const error = new Error("private network failure");
            fetchKeys.mockRejectedValueOnce(error);

            // Act
            const result = service.onModuleInit();

            // Assert
            await expect(result).rejects.toBe(error);
        });

        it("[case] - reports a key refresh timeout as an upstream failure", async () => {
            // Arrange
            remoteKeys.mockImplementationOnce((url, options) =>
                jose.createRemoteJWKSet(url, { ...options, cacheMaxAge: 0, [jose.customFetch]: fetchKeys }),
            );
            await service.onModuleInit();
            const token = await sign(claims);
            fetchKeys.mockRejectedValueOnce(new jose.errors.JWKSTimeout());

            // Act
            const result = service.verifyAccess({ token });

            // Assert
            await expect(result).rejects.toMatchObject({
                statusCode: 502,
                messageKey: "services.jwt.JWKS_UNAVAILABLE",
            });
        });
    });
});
