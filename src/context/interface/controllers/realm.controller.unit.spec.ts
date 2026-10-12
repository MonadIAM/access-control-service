import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import { beforeAll, describe, expect, it, jest } from "@jest/globals";
import { HttpStatus } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { PermissionCode, PrivilegeScope } from "~context/enums";
import { SYSTEM_REALM_ID } from "~context/constants";

jest.unstable_mockModule("~context/application/commands", () => ({ REALM_COMMANDS: Symbol("REALM_COMMANDS") }));
jest.unstable_mockModule("~context/application/queries", () => ({ REALM_QUERIES: Symbol("REALM_QUERIES") }));
jest.unstable_mockModule("~context/infrastructure/services", () => ({
    PROJECTION_CACHE_SERVICE: Symbol("PROJECTION_CACHE_SERVICE"),
}));

let RealmController: typeof import("./realm.controller").RealmController;
let PermissionGuard: typeof import("~context/infrastructure/guards/permission.guard").PermissionGuard;

beforeAll(async () => {
    const controllerPath = "./realm.controller";
    const guardPath = "~context/infrastructure/guards/permission.guard";
    ({ RealmController } = await import(controllerPath));
    ({ PermissionGuard } = await import(guardPath));
});

const account = "00000000-0000-4000-8000-100000000001";
const workspace = "00000000-0000-4000-8000-100000000002";
const operations = [
    { method: "create", permission: PermissionCode.REALM_CREATE },
    { method: "revoke", permission: PermissionCode.REALM_REVOKE },
    { method: "restore", permission: PermissionCode.REALM_RESTORE },
    { method: "purge", permission: PermissionCode.REALM_PURGE },
] as const;

describe("[Controller] - Realm lifecycle authorization", () => {
    describe.each(operations)("[Method] - $method", ({ method, permission }) => {
        it.each([
            { name: "workspace administrator", realms: [workspace], scope: PrivilegeScope.REALM, allowed: false },
            { name: "ordinary system user", realms: [SYSTEM_REALM_ID], scope: PrivilegeScope.REALM, allowed: false },
            { name: "platform administrator", realms: [SYSTEM_REALM_ID], scope: PrivilegeScope.GLOBAL, allowed: true },
        ])("[case] - enforces platform access for $name", async ({ realms, scope, allowed }) => {
            // Arrange
            const checkPermissions = jest.fn<InfrastructureServices.ProjectionCache.CheckPermissions.Signature>(
                ({ globalOnly }) =>
                    Promise.resolve(globalOnly && scope !== PrivilegeScope.GLOBAL ? {} : { [permission]: scope }),
            );
            const cache = { checkPermissions } as unknown as InfrastructureServices.ProjectionCache.PublicContract;
            const guard = new PermissionGuard(cache, new Reflector());
            const request = {
                query: { realm: realms[0] },
                session: { account, realms },
                metadata: {},
            };
            const context = new ExecutionContextHost([request], RealmController, RealmController.prototype[method]);

            // Act
            const result = guard.canActivate(context);

            // Assert
            if (allowed) {
                await expect(result).resolves.toBe(true);
                expect(request.metadata).toEqual({ permissions: { [permission]: PrivilegeScope.GLOBAL } });
            } else {
                await expect(result).rejects.toMatchObject({ statusCode: HttpStatus.FORBIDDEN });
            }

            if (realms[0] === SYSTEM_REALM_ID) {
                expect(checkPermissions).toHaveBeenCalledWith({
                    globalOnly: true,
                    permissions: [permission],
                    realm: SYSTEM_REALM_ID,
                    account,
                });
            } else {
                expect(checkPermissions).not.toHaveBeenCalled();
            }
        });
    });
});
