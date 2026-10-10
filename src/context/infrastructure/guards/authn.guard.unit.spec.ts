import { beforeAll, describe, expect, it } from "@jest/globals";
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
});
