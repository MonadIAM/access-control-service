import { describe, expect, it } from "@jest/globals";
import { Reflector } from "@nestjs/core";

import { PermissionCode } from "~context/enums";

import { RequireGlobalPermission } from "./require-global-permission.decorator";
import { RequirePermission } from "./require-permission.decorator";
import { SkipInterceptors } from "./skip-interceptors.decorator";
import { Reauthentication } from "./reauthentication.decorator";
import { FormatResponse } from "./format-response.decorator";
import { Public } from "./public.decorator";
import {
    REQUIRE_GLOBAL_PERMISSION,
    FORMAT_RESPONSE_DTO,
    REQUIRE_PERMISSION,
    SKIP_INTERCEPTORS,
    REAUTHENTICATION,
    IS_PUBLIC,
} from "./tokens";

class ResponseDTO {}
const reflector = new Reflector();
const permissions = [PermissionCode.REALM_READ_ABSOLUTE, PermissionCode.REALM_UPDATE];
const cases = [
    /* eslint-disable prettier/prettier */
    { name: "Public", decorator: Public(), token: IS_PUBLIC, value: true },
    { name: "SkipInterceptors", decorator: SkipInterceptors(), token: SKIP_INTERCEPTORS, value: true },
    { name: "FormatResponse", decorator: FormatResponse(ResponseDTO), token: FORMAT_RESPONSE_DTO, value: ResponseDTO },
    { name: "RequirePermission", decorator: RequirePermission(...permissions), token: REQUIRE_PERMISSION, value: permissions },
    { name: "RequireGlobalPermission", decorator: RequireGlobalPermission(...permissions), token: REQUIRE_GLOBAL_PERMISSION, value: permissions },
    /* eslint-enable prettier/prettier */
];

describe("Decorator metadata contracts", () => {
    describe("controller and handler metadata", () => {
        it.each(cases)("$name exposes controller metadata to consumers", ({ decorator, token, value }) => {
            @decorator
            class Controller {
                public handle(): void {}
            }
            class Unmarked {}

            expect(reflector.getAllAndOverride(token, [Controller.prototype.handle, Controller])).toEqual(value);
            expect(reflector.get(token, Unmarked)).toBeUndefined();
        });

        it.each(cases)("$name applies only to the decorated handler", ({ decorator, token, value }) => {
            class Controller {
                @decorator
                public handle(): void {}
                public other(): void {}
            }

            expect(reflector.get(token, Controller.prototype.handle)).toEqual(value);
            expect(reflector.get(token, Controller.prototype.other)).toBeUndefined();
            expect(reflector.get(token, Controller)).toBeUndefined();
        });
    });

    describe("Reauthentication", () => {
        it("exposes the reauthentication requirement only on its handler", () => {
            class Controller {
                @Reauthentication()
                public sensitive(): void {}
                public ordinary(): void {}
            }

            expect(reflector.get(REAUTHENTICATION, Controller.prototype.sensitive)).toBe(true);
            expect(reflector.get(REAUTHENTICATION, Controller.prototype.ordinary)).toBeUndefined();
        });
    });

    describe("RequirePermission / RequireGlobalPermission", () => {
        it.each([
            { name: "realm permissions", decorate: RequirePermission, token: REQUIRE_PERMISSION },
            { name: "global permissions", decorate: RequireGlobalPermission, token: REQUIRE_GLOBAL_PERMISSION },
        ])("handler $name override controller requirements, including an empty list", ({ decorate, token }) => {
            @decorate(...permissions)
            class Controller {
                @decorate(PermissionCode.REALM_UPDATE)
                public update(): void {}
                @decorate()
                public unrestricted(): void {}
                public inherited(): void {}
            }

            expect(reflector.getAllAndOverride(token, [Controller.prototype.update, Controller])).toEqual([
                PermissionCode.REALM_UPDATE,
            ]);
            expect(reflector.getAllAndOverride(token, [Controller.prototype.unrestricted, Controller])).toEqual([]);
            expect(reflector.getAllAndOverride(token, [Controller.prototype.inherited, Controller])).toEqual(permissions);
        });

        it("keeps realm and global permission metadata independent", () => {
            class Controller {
                @RequirePermission(PermissionCode.REALM_UPDATE)
                @RequireGlobalPermission(PermissionCode.REALM_READ_ABSOLUTE)
                public handle(): void {}
            }

            expect(reflector.get(REQUIRE_PERMISSION, Controller.prototype.handle)).toEqual([PermissionCode.REALM_UPDATE]);
            expect(reflector.get(REQUIRE_GLOBAL_PERMISSION, Controller.prototype.handle)).toEqual([
                PermissionCode.REALM_READ_ABSOLUTE,
            ]);
        });
    });

    describe("FormatResponse", () => {
        it("lets a handler select its own response DTO", () => {
            class HandlerDTO {}
            @FormatResponse(ResponseDTO)
            class Controller {
                @FormatResponse(HandlerDTO)
                public handle(): void {}
            }

            expect(reflector.get(FORMAT_RESPONSE_DTO, Controller.prototype.handle)).toBe(HandlerDTO);
            expect(reflector.get(FORMAT_RESPONSE_DTO, Controller)).toBe(ResponseDTO);
        });
    });
});
