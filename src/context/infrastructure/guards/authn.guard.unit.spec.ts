import { afterAll, afterEach, beforeAll, describe, expect, it } from "@jest/globals";
import { context as apiContext, SpanStatusCode, trace, type SpanContext } from "@opentelemetry/api";
import { HttpStatus } from "@nestjs/common";

import { GuardUnitHelpers } from "~testing/unit/guards/guard.helpers";
import { DEFAULT_OAUTH_SCOPE } from "~context/constants";
import { IS_PUBLIC } from "~common/decorators/tokens";

/* eslint-disable prettier/prettier */
const SESSION_ID = "00000000-0000-4000-8000-000000000001";
const ACCOUNT_ID = "00000000-0000-4000-8000-000000000002";
const CLIENT_ID  = "00000000-0000-4000-8000-000000000003";
const REALM_ID   = "00000000-0000-4000-8000-000000000004";
/* eslint-enable prettier/prettier */

const TOKEN = "header.payload.signature";

const helpers = new GuardUnitHelpers();

beforeAll(() => helpers.initialize());

describe("[Guard] - Authn", () => {
    describe("[Method] - canActivate", () => {
        it("[case] - allows public handlers without authentication", async () => {
            // Arrange
            const { guard, verifyAccess, exists } = helpers.authn();
            const request = helpers.request();
            const context = helpers.context({ request, handlerMetadata: [[IS_PUBLIC, true]] });

            // Act
            const result = await guard.canActivate(context);

            // Assert
            expect(result).toBe(true);
            expect(verifyAccess).not.toHaveBeenCalled();
            expect(exists).not.toHaveBeenCalled();
        });

        it("[case] - allows controllers marked as public without authentication", async () => {
            // Arrange
            const { guard, verifyAccess, exists } = helpers.authn();
            const request = helpers.request();
            const context = helpers.context({ request, classMetadata: [[IS_PUBLIC, true]] });

            // Act
            const result = await guard.canActivate(context);

            // Assert
            expect(result).toBe(true);
            expect(verifyAccess).not.toHaveBeenCalled();
            expect(exists).not.toHaveBeenCalled();
        });

        it("[case] - rejects a missing bearer token", async () => {
            // Arrange
            const { guard } = helpers.authn();
            const context = helpers.context({ request: helpers.request() });

            // Act
            const result = guard.canActivate(context);

            // Assert
            await expect(result).rejects.toMatchObject({
                message: "guard.authn.TOKEN_MISSING",
                statusCode: HttpStatus.UNAUTHORIZED,
                headers: { "WWW-Authenticate": 'Bearer realm="system"' },
            });
        });

        it("[case] - rejects a malformed authorization header", async () => {
            // Arrange
            const { guard } = helpers.authn();
            const request = helpers.request({ headers: { authorization: "Basic token" } });
            const context = helpers.context({ request });

            // Act
            const result = guard.canActivate(context);

            // Assert
            await expect(result).rejects.toMatchObject({
                message: "guard.authn.MALFORMED_AUTHORIZATION",
                statusCode: HttpStatus.BAD_REQUEST,
                headers: {
                    "WWW-Authenticate":
                        'Bearer error="invalid_request", error_description="The Authorization header is malformed; expected format: Bearer <token>"',
                },
            });
        });

        it("[case] - accepts a case-insensitive bearer scheme and multiple spaces", async () => {
            // Arrange
            const { guard, verifyAccess } = helpers.authn();
            const request = helpers.request({ headers: { authorization: `bearer   ${TOKEN}` } });
            const context = helpers.context({ request });

            // Act
            const result = await guard.canActivate(context);

            // Assert
            expect(result).toBe(true);
            expect(verifyAccess).toHaveBeenCalledWith({ token: TOKEN });
        });

        it("[case] - verifies an active session and assigns request session data", async () => {
            // Arrange
            const request = helpers.request({ headers: { authorization: `Bearer ${TOKEN}` } });
            const { guard, verifyAccess, exists } = helpers.authn({ scope: "openid profile" });

            // Act
            const result = await guard.canActivate(helpers.context({ request }));

            // Assert
            expect(result).toBe(true);
            expect(verifyAccess).toHaveBeenCalledWith({ token: TOKEN });
            expect(exists).toHaveBeenCalledWith({ session: SESSION_ID });
            expect(request.session).toEqual({
                scope: "openid profile",
                client: CLIENT_ID,
                realms: [REALM_ID],
                session: SESSION_ID,
                account: ACCOUNT_ID,
            });
        });

        it("[case] - uses the default scope when the token has no scope", async () => {
            // Arrange
            const request = helpers.request({ headers: { authorization: `Bearer ${TOKEN}` } });
            const { guard } = helpers.authn();

            // Act
            await guard.canActivate(helpers.context({ request }));

            // Assert
            expect(request.session.scope).toBe(DEFAULT_OAUTH_SCOPE);
        });

        it("[case] - propagates token verification failures without querying the blacklist", async () => {
            // Arrange
            const error = new Error("verification failed");
            const { guard, verifyAccess, exists } = helpers.authn();
            const request = helpers.request({ headers: { authorization: `Bearer ${TOKEN}` } });
            verifyAccess.mockRejectedValueOnce(error);

            // Act
            const result = guard.canActivate(helpers.context({ request }));

            // Assert
            await expect(result).rejects.toBe(error);
            expect(exists).not.toHaveBeenCalled();
        });

        it("[case] - fails closed when the blacklist lookup fails", async () => {
            // Arrange
            const error = new Error("blacklist unavailable");
            const request = helpers.request({ headers: { authorization: `Bearer ${TOKEN}` } });
            const { guard, exists } = helpers.authn();
            exists.mockRejectedValueOnce(error);

            // Act
            const result = guard.canActivate(helpers.context({ request }));

            // Assert
            await expect(result).rejects.toBe(error);
            expect(request.session).toEqual({});
        });

        it("[case] - rejects a blacklisted session", async () => {
            // Arrange
            const { guard } = helpers.authn({ blacklisted: true });
            const request = helpers.request({ headers: { authorization: `Bearer ${TOKEN}` } });

            // Act
            const result = guard.canActivate(helpers.context({ request }));

            // Assert
            await expect(result).rejects.toMatchObject({
                message: "guard.authn.SESSION_REVOKED",
                statusCode: HttpStatus.UNAUTHORIZED,
                headers: {
                    "WWW-Authenticate":
                        'Bearer error="invalid_token", error_description="The session associated with this access token has been revoked"',
                },
            });
        });
    });
    describe("[Behavior] - tracing", () => {
        const { sdk, exporter } = helpers.tracing();

        beforeAll(() => sdk.start());
        afterEach(() => exporter.reset());
        afterAll(async () => {
            await sdk.shutdown();
            trace.disable();
            apiContext.disable();
        });

        it("[case] - preserves the parent and active guard span across asynchronous dependencies", async () => {
            // Arrange
            const { guard, exists } = helpers.authn();
            const request = helpers.request({ headers: { authorization: `Bearer ${TOKEN}` } });
            const context = helpers.context({ request });
            let active: Optional<SpanContext>;
            exists.mockImplementationOnce(async () => {
                await Promise.resolve();
                active = trace.getActiveSpan()?.spanContext();
                return false;
            });

            // Act
            const result = await trace.getTracer("test").startActiveSpan("request", async (parent) => {
                try {
                    return await guard.canActivate(context);
                } finally {
                    parent.end();
                }
            });

            // Assert
            const spans = exporter.getFinishedSpans();
            expect(result).toBe(true);
            expect(spans).toHaveLength(2);
            expect(spans[0].name).toBe("guard.authentication");
            expect(spans[1].name).toBe("request");
            expect(spans[0].parentSpanContext).toEqual(spans[1].spanContext());
            expect(active).toEqual(spans[0].spanContext());
            expect(trace.getActiveSpan()).toBeUndefined();
        });

        it("[case] - finishes one span when the guard allows the request", async () => {
            // Arrange
            const { guard } = helpers.authn();
            const context = helpers.context({ request: helpers.request(), handlerMetadata: [[IS_PUBLIC, true]] });

            // Act
            const result = await guard.canActivate(context);

            // Assert
            expect(result).toBe(true);
            expect(exporter.getFinishedSpans()).toHaveLength(1);
            expect(exporter.getFinishedSpans()[0]).toMatchObject({
                name: "guard.authentication",
                status: { code: SpanStatusCode.UNSET },
                attributes: {},
                events: [],
                ended: true,
            });
        });

        it("[case] - preserves the failure and finishes the span without private data", async () => {
            // Arrange
            const error = new Error("private dependency failure");
            const { guard, verifyAccess } = helpers.authn();
            const request = helpers.request({ headers: { authorization: `Bearer ${TOKEN}` } });
            verifyAccess.mockRejectedValueOnce(error);
            const context = helpers.context({ request });

            // Act
            const result = guard.canActivate(context);

            // Assert
            await expect(result).rejects.toBe(error);
            expect(exporter.getFinishedSpans()).toHaveLength(1);
            expect(exporter.getFinishedSpans()[0]).toMatchObject({
                name: "guard.authentication",
                status: { code: SpanStatusCode.ERROR },
                attributes: {},
                events: [],
                ended: true,
            });
        });
    });
});
