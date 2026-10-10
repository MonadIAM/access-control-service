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

describe("[Decorator] - Metadata", () => {
    describe("[Behavior] - controller and handler metadata", () => {
        it.each(cases)("[case] - exposes controller metadata to consumers ($name)", ({ decorator, token, value }) => {
            // Arrange
            @decorator
            class Controller {
                public handle(): void {}
            }
            class Unmarked {}

            // Act
            const result = reflector.getAllAndOverride(token, [Controller.prototype.handle, Controller]);
            const result2 = reflector.get(token, Unmarked);

            // Assert
            expect(result).toEqual(value);
            expect(result2).toBeUndefined();
        });

        it.each(cases)("[case] - applies only to the decorated handler ($name)", ({ decorator, token, value }) => {
            // Arrange
            class Controller {
                @decorator
                public handle(): void {}
                public other(): void {}
            }

            // Act
            const result = reflector.get(token, Controller.prototype.handle);
            const result2 = reflector.get(token, Controller.prototype.other);
            const result3 = reflector.get(token, Controller);

            // Assert
            expect(result).toEqual(value);
            expect(result2).toBeUndefined();
            expect(result3).toBeUndefined();
        });
    });

    describe("[Function] - Reauthentication", () => {
        it("[case] - exposes the reauthentication requirement only on its handler", () => {
            // Arrange
            class Controller {
                @Reauthentication()
                public sensitive(): void {}
                public ordinary(): void {}
            }

            // Act
            const result = reflector.get(REAUTHENTICATION, Controller.prototype.sensitive);
            const result2 = reflector.get(REAUTHENTICATION, Controller.prototype.ordinary);

            // Assert
            expect(result).toBe(true);
            expect(result2).toBeUndefined();
        });
    });

    describe("[Behavior] - permission metadata", () => {
        it.each([
            { name: "realm permissions", decorate: RequirePermission, token: REQUIRE_PERMISSION },
            { name: "global permissions", decorate: RequireGlobalPermission, token: REQUIRE_GLOBAL_PERMISSION },
        ])("[case] - overrides controller $name, including an empty list", ({ decorate, token }) => {
            // Arrange
            @decorate(...permissions)
            class Controller {
                @decorate(PermissionCode.REALM_UPDATE)
                public update(): void {}
                @decorate()
                public unrestricted(): void {}
                public inherited(): void {}
            }

            // Act
            const result = reflector.getAllAndOverride(token, [Controller.prototype.update, Controller]);
            const result2 = reflector.getAllAndOverride(token, [Controller.prototype.unrestricted, Controller]);
            const result3 = reflector.getAllAndOverride(token, [Controller.prototype.inherited, Controller]);

            // Assert
            expect(result).toEqual([PermissionCode.REALM_UPDATE]);
            expect(result2).toEqual([]);
            expect(result3).toEqual(permissions);
        });

        it("[case] - keeps realm and global permission metadata independent", () => {
            // Arrange
            class Controller {
                @RequirePermission(PermissionCode.REALM_UPDATE)
                @RequireGlobalPermission(PermissionCode.REALM_READ_ABSOLUTE)
                public handle(): void {}
            }

            // Act
            const result = reflector.get(REQUIRE_PERMISSION, Controller.prototype.handle);
            const result2 = reflector.get(REQUIRE_GLOBAL_PERMISSION, Controller.prototype.handle);

            // Assert
            expect(result).toEqual([PermissionCode.REALM_UPDATE]);
            expect(result2).toEqual([PermissionCode.REALM_READ_ABSOLUTE]);
        });
    });

    describe("[Function] - FormatResponse", () => {
        it("[case] - lets a handler select its own response DTO", () => {
            // Arrange
            class HandlerDTO {}
            @FormatResponse(ResponseDTO)
            class Controller {
                @FormatResponse(HandlerDTO)
                public handle(): void {}
            }

            // Act
            const result = reflector.get(FORMAT_RESPONSE_DTO, Controller.prototype.handle);
            const result2 = reflector.get(FORMAT_RESPONSE_DTO, Controller);

            // Assert
            expect(result).toBe(HandlerDTO);
            expect(result2).toBe(ResponseDTO);
        });
    });
});
