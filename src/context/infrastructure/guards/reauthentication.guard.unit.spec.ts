import { beforeAll, describe, expect, it } from "@jest/globals";
import { HttpStatus } from "@nestjs/common";

import { GuardUnitHelpers } from "~testing/unit/guards/guard.helpers";
import { REAUTHENTICATION } from "~common/decorators/tokens";

const SESSION_ID = "00000000-0000-4000-8000-200000000001";

const helpers = new GuardUnitHelpers();

beforeAll(() => helpers.initialize());

describe("[Guard] - Reauthentication", () => {
    describe("[Method] - canActivate", () => {
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
            const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, true]] });

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
            const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, true]] });

            // Act
            const result = guard.canActivate(context);

            // Assert
            await expect(result).rejects.toMatchObject({
                message: "guard.reauthentication.REAUTHENTICATION_REQUIRED",
                statusCode: HttpStatus.FORBIDDEN,
            });
            expect(exists).toHaveBeenCalledWith({ session: SESSION_ID });
        });

        it("[case] - fails closed when the reauthentication cache lookup fails", async () => {
            // Arrange
            const error = new Error("reauthentication cache unavailable");
            const { guard, exists } = helpers.reauthentication();
            const request = helpers.request({ session: { session: SESSION_ID } });
            const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, true]] });
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
            const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, true]] });

            // Act
            const result = await guard.canActivate(context);

            // Assert
            expect(result).toBe(true);
            expect(exists).toHaveBeenCalledWith({ session: SESSION_ID });
        });

        it("[case] - reads the reauthentication requirement from controller metadata", async () => {
            // Arrange
            const { guard, exists } = helpers.reauthentication({ active: true });
            const request = helpers.request({ session: { session: SESSION_ID } });
            const context = helpers.context({ request, classMetadata: [[REAUTHENTICATION, true]] });

            // Act
            const result = await guard.canActivate(context);

            // Assert
            expect(result).toBe(true);
            expect(exists).toHaveBeenCalledWith({ session: SESSION_ID });
        });
    });
});
