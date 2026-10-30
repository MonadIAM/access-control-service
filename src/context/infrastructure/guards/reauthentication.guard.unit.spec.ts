import { beforeAll, describe, expect, it } from "@jest/globals";
import { HttpStatus } from "@nestjs/common";

import { GuardUnitHelpers } from "~testing/unit/guards/guard.helpers";
import { REAUTHENTICATION } from "~common/decorators/tokens";
import { ReauthenticationMethod } from "~context/enums";

const SESSION_ID = "00000000-0000-4000-8000-200000000001";
const FACTOR_ID = "00000000-0000-4000-8000-200000000002";
const FACTOR_OPTIONS: Reauthentication.Options = {
    methods: [ReauthenticationMethod.TOTP],
    sameFactor: true,
};

const helpers = new GuardUnitHelpers();

beforeAll(() => helpers.initialize());

describe("[Guard] - Reauthentication", () => {
    describe("[Method] - canActivate", () => {
        it("[case] - matches the requested factor against the current session's proof", async () => {
            // Arrange
            const { guard, exists, get } = helpers.reauthentication({
                proof: { method: ReauthenticationMethod.TOTP, factor: FACTOR_ID },
            });
            const request = helpers.request({ session: { session: SESSION_ID }, query: { factor: FACTOR_ID } });
            const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, FACTOR_OPTIONS]] });

            // Act
            const result = await guard.canActivate(context);

            // Assert
            expect(result).toBe(true);
            expect(get.mock.calls).toEqual([[{ session: SESSION_ID, method: ReauthenticationMethod.TOTP }]]);
            expect(exists).not.toHaveBeenCalled();
        });

        it.each<Nullable<InfrastructureServices.ReauthenticationCache.Proof>>([
            null,
            { method: ReauthenticationMethod.PASSWORD },
            { method: ReauthenticationMethod.OTP },
            { method: ReauthenticationMethod.TOTP, factor: "another-factor" },
        ])("[case] - rejects an absent or unrelated proof despite an active general grant: %j", async (proof) => {
            // Arrange
            const { guard, exists } = helpers.reauthentication({ active: true, proof });
            const request = helpers.request({ session: { session: SESSION_ID }, query: { factor: FACTOR_ID } });
            const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, FACTOR_OPTIONS]] });

            // Act
            const result = guard.canActivate(context);

            // Assert
            await expect(result).rejects.toMatchObject({
                message: "guard.reauthentication.REAUTHENTICATION_REQUIRED",
                statusCode: HttpStatus.FORBIDDEN,
            });
            expect(exists).not.toHaveBeenCalled();
        });

        it.each([undefined, null, "", 42, {}, [FACTOR_ID]])(
            "[case] - refuses a missing or malformed factor before reading Redis: %j",
            async (factor) => {
                // Arrange
                const { guard, exists, get } = helpers.reauthentication({ active: true });
                const request = helpers.request({ session: { session: SESSION_ID }, query: { factor } });
                const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, FACTOR_OPTIONS]] });

                // Act
                const result = guard.canActivate(context);

                // Assert
                await expect(result).rejects.toMatchObject({ statusCode: HttpStatus.FORBIDDEN });
                expect(exists).not.toHaveBeenCalled();
                expect(get).not.toHaveBeenCalled();
            },
        );

        it.each([undefined, null, "invalid-query", [FACTOR_ID], Object.create({ factor: FACTOR_ID })])(
            "[case] - refuses an invalid query or an inherited factor property: %j",
            async (query) => {
                // Arrange
                const { guard, get } = helpers.reauthentication({ active: true });
                const request = helpers.request({ session: { session: SESSION_ID }, query });
                const options: Reauthentication.Options = {
                    methods: [ReauthenticationMethod.TOTP],
                    sameFactor: true,
                };
                const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, options]] });

                // Act
                const result = guard.canActivate(context);

                // Assert
                await expect(result).rejects.toMatchObject({ statusCode: HttpStatus.FORBIDDEN });
                expect(get).not.toHaveBeenCalled();
            },
        );

        it("[case] - requires the factor in the query even when the body and params contain it", async () => {
            // Arrange
            const { guard, get, exists } = helpers.reauthentication({ active: true });
            const request = helpers.request({
                session: { session: SESSION_ID },
                body: { factor: FACTOR_ID },
                params: { factor: FACTOR_ID },
            });
            const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, FACTOR_OPTIONS]] });

            // Act
            const result = guard.canActivate(context);

            // Assert
            await expect(result).rejects.toMatchObject({ statusCode: HttpStatus.FORBIDDEN });
            expect(get).not.toHaveBeenCalled();
            expect(exists).not.toHaveBeenCalled();
        });

        it("[case] - uses the ordinary check when the same-factor requirement is disabled", async () => {
            // Arrange
            const { guard, get, exists } = helpers.reauthentication({ active: true });
            const request = helpers.request({ session: { session: SESSION_ID }, query: { factor: FACTOR_ID } });
            const options: Reauthentication.Options = { methods: [ReauthenticationMethod.TOTP], sameFactor: false };
            const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, options]] });

            // Act
            const result = await guard.canActivate(context);

            // Assert
            expect(result).toBe(true);
            expect(get).not.toHaveBeenCalled();
            expect(exists).toHaveBeenCalledWith({ session: SESSION_ID, methods: [ReauthenticationMethod.TOTP] });
        });

        it("[case] - rejects a matching factor proof from a method outside the allowed list", async () => {
            // Arrange
            const { guard, get } = helpers.reauthentication({
                proof: { method: ReauthenticationMethod.TOTP, factor: FACTOR_ID },
            });
            const request = helpers.request({ session: { session: SESSION_ID }, query: { factor: FACTOR_ID } });
            const options = { ...FACTOR_OPTIONS, methods: [ReauthenticationMethod.PASSWORD] };
            const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, options]] });

            // Act
            const result = guard.canActivate(context);

            // Assert
            await expect(result).rejects.toMatchObject({ statusCode: HttpStatus.FORBIDDEN });
            expect(get.mock.calls).toEqual([[{ session: SESSION_ID, method: ReauthenticationMethod.PASSWORD }]]);
        });

        it.each([undefined, []])(
            "[case] - checks all methods when a factor restriction has no method list: %j",
            async (methods) => {
                // Arrange
                const { guard, get, exists } = helpers.reauthentication({
                    proof: { method: ReauthenticationMethod.TOTP, factor: FACTOR_ID },
                });
                const request = helpers.request({ session: { session: SESSION_ID }, query: { factor: FACTOR_ID } });
                const options: Reauthentication.Options = { methods, sameFactor: true };
                const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, options]] });

                // Act
                const result = await guard.canActivate(context);

                // Assert
                expect(result).toBe(true);
                expect(get.mock.calls).toEqual(
                    Object.values(ReauthenticationMethod).map((method) => [{ session: SESSION_ID, method }]),
                );
                expect(exists).not.toHaveBeenCalled();
            },
        );

        it("[case] - rejects a factor-bound request without an authenticated session", async () => {
            // Arrange
            const { guard, get } = helpers.reauthentication();
            const request = helpers.request({ query: { factor: FACTOR_ID } });
            const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, FACTOR_OPTIONS]] });

            // Act
            const result = guard.canActivate(context);

            // Assert
            await expect(result).rejects.toMatchObject({ statusCode: HttpStatus.UNAUTHORIZED });
            expect(get).not.toHaveBeenCalled();
        });

        it("[case] - propagates proof lookup failures without falling back to the general grant", async () => {
            // Arrange
            const error = new Error("Reauthentication cache unavailable");
            const { guard, exists, get } = helpers.reauthentication({ active: true });
            const request = helpers.request({ session: { session: SESSION_ID }, query: { factor: FACTOR_ID } });
            const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, FACTOR_OPTIONS]] });
            get.mockRejectedValueOnce(error);

            // Act
            const result = guard.canActivate(context);

            // Assert
            await expect(result).rejects.toBe(error);
            expect(exists).not.toHaveBeenCalled();
        });

        it.each([true, false])("[case] - checks the allowed methods against the cache (active: %s)", async (active) => {
            // Arrange
            const { guard, exists } = helpers.reauthentication({ active });
            const methods = [ReauthenticationMethod.TOTP, ReauthenticationMethod.OTP];
            const request = helpers.request({ session: { session: SESSION_ID } });
            const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, { methods }]] });

            // Act
            const result = guard.canActivate(context);

            // Assert
            if (active) {
                await expect(result).resolves.toBe(true);
            } else {
                await expect(result).rejects.toMatchObject({
                    message: "guard.reauthentication.REAUTHENTICATION_REQUIRED",
                    statusCode: HttpStatus.FORBIDDEN,
                });
            }
            expect(exists).toHaveBeenCalledWith({ session: SESSION_ID, methods });
        });

        it("[case] - lets an unrestricted handler override the controller's allowed methods", async () => {
            // Arrange
            const { guard, exists } = helpers.reauthentication({ active: true });
            const request = helpers.request({ session: { session: SESSION_ID } });
            const context = helpers.context({
                classMetadata: [[REAUTHENTICATION, { methods: [ReauthenticationMethod.TOTP] }]],
                handlerMetadata: [[REAUTHENTICATION, { methods: [] }]],
                request,
            });

            // Act
            const result = await guard.canActivate(context);

            // Assert
            expect(result).toBe(true);
            expect(exists).toHaveBeenCalledWith({ session: SESSION_ID, methods: [] });
        });

        it("[case] - allows handlers that do not require reauthentication", async () => {
            // Arrange
            const { guard, exists } = helpers.reauthentication();
            const context = helpers.context({ request: helpers.request() });

            // Act
            const result = await guard.canActivate(context);

            // Assert
            expect(result).toBe(true);
            expect(exists).not.toHaveBeenCalled();
        });

        it("[case] - rejects an unauthenticated request", async () => {
            // Arrange
            const { guard } = helpers.reauthentication();
            const request = helpers.request();
            const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, { methods: [] }]] });

            // Act
            const result = guard.canActivate(context);

            // Assert
            await expect(result).rejects.toMatchObject({
                message: "guard.reauthentication.NOT_AUTHENTICATED",
                statusCode: HttpStatus.UNAUTHORIZED,
                headers: { "WWW-Authenticate": 'Bearer realm="system"' },
            });
        });

        it("[case] - rejects a session without active reauthentication", async () => {
            // Arrange
            const { guard, exists } = helpers.reauthentication();
            const request = helpers.request({ session: { session: SESSION_ID } });
            const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, { methods: [] }]] });

            // Act
            const result = guard.canActivate(context);

            // Assert
            await expect(result).rejects.toMatchObject({
                message: "guard.reauthentication.REAUTHENTICATION_REQUIRED",
                statusCode: HttpStatus.FORBIDDEN,
            });
            expect(exists).toHaveBeenCalledWith({ session: SESSION_ID, methods: [] });
        });

        it("[case] - fails closed when the reauthentication cache lookup fails", async () => {
            // Arrange
            const error = new Error("reauthentication cache unavailable");
            const { guard, exists } = helpers.reauthentication();
            const request = helpers.request({ session: { session: SESSION_ID } });
            const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, { methods: [] }]] });
            exists.mockRejectedValueOnce(error);

            // Act
            const result = guard.canActivate(context);

            // Assert
            await expect(result).rejects.toBe(error);
        });

        it("[case] - allows a session with active reauthentication", async () => {
            // Arrange
            const { guard, exists } = helpers.reauthentication({ active: true });
            const request = helpers.request({ session: { session: SESSION_ID } });
            const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, { methods: [] }]] });

            // Act
            const result = await guard.canActivate(context);

            // Assert
            expect(result).toBe(true);
            expect(exists).toHaveBeenCalledWith({ session: SESSION_ID, methods: [] });
        });

        it("[case] - reads the reauthentication requirement from controller metadata", async () => {
            // Arrange
            const { guard, exists } = helpers.reauthentication({ active: true });
            const request = helpers.request({ session: { session: SESSION_ID } });
            const context = helpers.context({ request, classMetadata: [[REAUTHENTICATION, { methods: [] }]] });

            // Act
            const result = await guard.canActivate(context);

            // Assert
            expect(result).toBe(true);
            expect(exists).toHaveBeenCalledWith({ session: SESSION_ID, methods: [] });
        });
    });
});
