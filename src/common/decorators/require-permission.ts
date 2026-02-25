import { SetMetadata } from "@nestjs/common";

import { PermissionCode } from "~context/enums";

export const REQUIRE_PERMISSION_KEY = Symbol("require-permission");

export function RequirePermission(permission: PermissionCode): MethodDecorator & ClassDecorator {
    return SetMetadata(REQUIRE_PERMISSION_KEY, permission);
}
