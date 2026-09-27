import { beforeAll, describe, expect, it } from "@jest/globals";
import { HttpStatus } from "@nestjs/common";

import { GuardUnitHelpers } from "~testing/unit/guards/guard.helpers";
import { REAUTHENTICATION } from "~common/decorators/tokens";

const SESSION_ID = "00000000-0000-4000-8000-200000000001";

const helpers = new GuardUnitHelpers();

beforeAll(() => helpers.initialize());

describe("ReauthenticationGuard", () => {
    describe("canActivate", () => {
        it("allows handlers that do not require reauthentication", async () => {
            const { guard, exists } = helpers.reauthentication();
            const context = helpers.context({ request: helpers.request() });

            await expect(guard.canActivate(context)).resolves.toBe(true);
            expect(exists).not.toHaveBeenCalled();
        });

        it("rejects an unauthenticated request", async () => {
            const { guard } = helpers.reauthentication();
            const request = helpers.request();
            const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, true]] });

            await expect(guard.canActivate(context)).rejects.toMatchObject({
                message: "guard.reauthentication.NOT_AUTHENTICATED",
                statusCode: HttpStatus.UNAUTHORIZED,
                headers: { "WWW-Authenticate": 'Bearer realm="system"' },
            });
        });

        it("rejects a session without active reauthentication", async () => {
            const { guard, exists } = helpers.reauthentication();
            const request = helpers.request({ session: { session: SESSION_ID } });
            const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, true]] });

            await expect(guard.canActivate(context)).rejects.toMatchObject({
                message: "guard.reauthentication.REAUTHENTICATION_REQUIRED",
                statusCode: HttpStatus.FORBIDDEN,
            });
            expect(exists).toHaveBeenCalledWith({ session: SESSION_ID });
        });

        it("fails closed when the reauthentication cache lookup fails", async () => {
            const error = new Error("reauthentication cache unavailable");
            const { guard, exists } = helpers.reauthentication();
            const request = helpers.request({ session: { session: SESSION_ID } });
            const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, true]] });
            exists.mockRejectedValueOnce(error);

            await expect(guard.canActivate(context)).rejects.toBe(error);
        });

        it("allows a session with active reauthentication", async () => {
            const { guard, exists } = helpers.reauthentication({ active: true });
            const request = helpers.request({ session: { session: SESSION_ID } });
            const context = helpers.context({ request, handlerMetadata: [[REAUTHENTICATION, true]] });

            await expect(guard.canActivate(context)).resolves.toBe(true);
            expect(exists).toHaveBeenCalledWith({ session: SESSION_ID });
        });

        it("reads the reauthentication requirement from controller metadata", async () => {
            const { guard, exists } = helpers.reauthentication({ active: true });
            const request = helpers.request({ session: { session: SESSION_ID } });
            const context = helpers.context({ request, classMetadata: [[REAUTHENTICATION, true]] });

            await expect(guard.canActivate(context)).resolves.toBe(true);
            expect(exists).toHaveBeenCalledWith({ session: SESSION_ID });
        });
    });
});
