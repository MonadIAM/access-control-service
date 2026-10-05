import { beforeAll, describe, expect, it } from "@jest/globals";
import { HttpStatus } from "@nestjs/common";

import { REQUIRE_GLOBAL_PERMISSION, REQUIRE_PERMISSION, IS_PUBLIC } from "~common/decorators/tokens";
import { GuardUnitHelpers } from "~testing/unit/guards/guard.helpers";
import { PermissionCode, PrivilegeScope } from "~context/enums";
import { SYSTEM_REALM_ID } from "~context/constants";

/* eslint-disable prettier/prettier */
const ACCOUNT_ID = "00000000-0000-4000-8000-100000000001";
const REALM_ID   = "00000000-0000-4000-8000-100000000002";
/* eslint-enable prettier/prettier */

const PERMISSION = PermissionCode.REALM_READ_ABSOLUTE;
const SECOND_PERMISSION = PermissionCode.REALM_UPDATE;

const helpers = new GuardUnitHelpers();

beforeAll(() => helpers.initialize());

describe("PermissionGuard", () => {
    describe("canActivate", () => {
        it("allows public handlers and handlers without required permissions", async () => {
            const { guard, checkPermissions } = helpers.permission();
            const publicHandler = helpers.context({
                request: helpers.request(),
                handlerMetadata: [
                    [IS_PUBLIC, true],
                    [REQUIRE_PERMISSION, [PERMISSION]],
                ],
            });
            const publicController = helpers.context({
                request: helpers.request(),
                handlerMetadata: [[REQUIRE_PERMISSION, [PERMISSION]]],
                classMetadata: [[IS_PUBLIC, true]],
            });
            const unrestricted = helpers.context({ request: helpers.request() });

            await expect(guard.canActivate(publicHandler)).resolves.toBe(true);
            await expect(guard.canActivate(publicController)).resolves.toBe(true);
            await expect(guard.canActivate(unrestricted)).resolves.toBe(true);
            expect(checkPermissions).not.toHaveBeenCalled();
        });

        it("requires an authenticated account", async () => {
            const { guard } = helpers.permission();
            const request = helpers.request({ session: { realms: [REALM_ID] } });
            const context = helpers.context({ request, handlerMetadata: [[REQUIRE_PERMISSION, [PERMISSION]]] });

            await expect(guard.canActivate(context)).rejects.toMatchObject({
                message: "guard.permission.ACCOUNT_REQUIRED",
                statusCode: HttpStatus.FORBIDDEN,
            });
        });

        it("rejects an empty requested realm", async () => {
            const { guard } = helpers.permission();
            const request = helpers.request({
                query: { realm: "" },
                session: { account: ACCOUNT_ID, realms: [REALM_ID] },
            });
            const context = helpers.context({ request, handlerMetadata: [[REQUIRE_PERMISSION, [PERMISSION]]] });

            await expect(guard.canActivate(context)).rejects.toMatchObject({
                message: "guard.permission.REALM_REQUIRED",
                statusCode: HttpStatus.FORBIDDEN,
            });
        });

        it("requires realm scope in the session", async () => {
            const { guard } = helpers.permission();
            const request = helpers.request({ session: { account: ACCOUNT_ID } });
            const context = helpers.context({ request, handlerMetadata: [[REQUIRE_PERMISSION, [PERMISSION]]] });

            await expect(guard.canActivate(context)).rejects.toMatchObject({
                message: "guard.permission.REALM_SCOPE_MISSING",
                statusCode: HttpStatus.FORBIDDEN,
            });
        });

        it("rejects a realm outside the session scope", async () => {
            const { guard } = helpers.permission();
            const request = helpers.request({
                query: { realm: REALM_ID },
                session: { account: ACCOUNT_ID, realms: [SYSTEM_REALM_ID] },
            });
            const context = helpers.context({ request, handlerMetadata: [[REQUIRE_PERMISSION, [PERMISSION]]] });

            await expect(guard.canActivate(context)).rejects.toMatchObject({
                message: "guard.permission.REALM_OUT_OF_SESSION_SCOPE",
                statusCode: HttpStatus.FORBIDDEN,
            });
        });

        it("requires a direct system login for global permissions", async () => {
            const { guard } = helpers.permission();
            const request = helpers.request({
                session: { account: ACCOUNT_ID, realms: [SYSTEM_REALM_ID, REALM_ID] },
            });
            const context = helpers.context({ request, handlerMetadata: [[REQUIRE_GLOBAL_PERMISSION, [PERMISSION]]] });

            await expect(guard.canActivate(context)).rejects.toMatchObject({
                message: "guard.permission.GLOBAL_SCOPE_REQUIRES_DIRECT_LOGIN",
                statusCode: HttpStatus.FORBIDDEN,
            });
        });

        it("rejects an account without a matched permission", async () => {
            const { guard } = helpers.permission({ matched: {} });
            const request = helpers.request({
                query: { realm: REALM_ID },
                session: { account: ACCOUNT_ID, realms: [REALM_ID] },
            });
            const context = helpers.context({ request, handlerMetadata: [[REQUIRE_PERMISSION, [PERMISSION]]] });

            await expect(guard.canActivate(context)).rejects.toMatchObject({
                message: "guard.permission.INSUFFICIENT_PERMISSIONS",
                statusCode: HttpStatus.FORBIDDEN,
            });
        });

        it("fails closed when the permission lookup fails", async () => {
            const error = new Error("permission cache unavailable");
            const request = helpers.request({
                query: { realm: REALM_ID },
                session: { account: ACCOUNT_ID, realms: [REALM_ID] },
            });
            const { guard, checkPermissions } = helpers.permission({ matched: { [PERMISSION]: PrivilegeScope.REALM } });
            checkPermissions.mockRejectedValueOnce(error);
            const context = helpers.context({ request, handlerMetadata: [[REQUIRE_PERMISSION, [PERMISSION]]] });

            await expect(guard.canActivate(context)).rejects.toBe(error);
            expect(request.metadata).toEqual({});
        });

        it.each([PrivilegeScope.REALM, PrivilegeScope.GLOBAL])(
            "preserves the matched %s scope in metadata",
            async (scope) => {
                const request = helpers.request({
                    query: { realm: REALM_ID },
                    session: { account: ACCOUNT_ID, realms: [REALM_ID] },
                });
                const { guard, checkPermissions } = helpers.permission({ matched: { [PERMISSION]: scope } });
                const context = helpers.context({ request, handlerMetadata: [[REQUIRE_PERMISSION, [PERMISSION]]] });

                const result = await guard.canActivate(context);

                expect(result).toBe(true);
                expect(checkPermissions).toHaveBeenCalledWith({
                    globalOnly: false,
                    permissions: [PERMISSION],
                    account: ACCOUNT_ID,
                    realm: REALM_ID,
                });
                expect(request.metadata).toEqual({ permissions: { [PERMISSION]: scope } });
                expect(checkPermissions).toHaveBeenCalledTimes(1);
            },
        );

        it("reads required permissions from controller metadata", async () => {
            const request = helpers.request({
                query: { realm: REALM_ID },
                session: { account: ACCOUNT_ID, realms: [REALM_ID] },
            });
            const { guard, checkPermissions } = helpers.permission({ matched: { [PERMISSION]: PrivilegeScope.REALM } });
            const context = helpers.context({ request, classMetadata: [[REQUIRE_PERMISSION, [PERMISSION]]] });

            await expect(guard.canActivate(context)).resolves.toBe(true);
            expect(checkPermissions).toHaveBeenCalledWith({
                globalOnly: false,
                permissions: [PERMISSION],
                account: ACCOUNT_ID,
                realm: REALM_ID,
            });
        });

        it("checks global permissions against the default system realm", async () => {
            const request = helpers.request({ session: { account: ACCOUNT_ID, realms: [SYSTEM_REALM_ID] } });
            const { guard, checkPermissions } = helpers.permission({ matched: { [PERMISSION]: PrivilegeScope.GLOBAL } });
            const context = helpers.context({ request, classMetadata: [[REQUIRE_GLOBAL_PERMISSION, [PERMISSION]]] });

            await expect(guard.canActivate(context)).resolves.toBe(true);
            expect(checkPermissions).toHaveBeenCalledWith({
                globalOnly: true,
                permissions: [PERMISSION],
                account: ACCOUNT_ID,
                realm: SYSTEM_REALM_ID,
            });
        });

        it("gives global permission metadata precedence over realm permission metadata", async () => {
            const request = helpers.request({ session: { account: ACCOUNT_ID, realms: [SYSTEM_REALM_ID] } });
            const { guard, checkPermissions } = helpers.permission({
                matched: { [SECOND_PERMISSION]: PrivilegeScope.GLOBAL },
            });
            const context = helpers.context({
                request,
                handlerMetadata: [
                    [REQUIRE_PERMISSION, [PERMISSION]],
                    [REQUIRE_GLOBAL_PERMISSION, [SECOND_PERMISSION]],
                ],
            });

            await expect(guard.canActivate(context)).resolves.toBe(true);
            expect(checkPermissions).toHaveBeenCalledWith({
                globalOnly: true,
                permissions: [SECOND_PERMISSION],
                account: ACCOUNT_ID,
                realm: SYSTEM_REALM_ID,
            });
        });
    });
});
