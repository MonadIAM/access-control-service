import { SetMetadata } from "@nestjs/common";

import { PermissionCode } from "~context/enums";

export const REQUIRE_PERMISSIONS_KEY = Symbol("require-permissions");

export function RequirePermission(...permissions: PermissionCode[]): MethodDecorator & ClassDecorator {
    return SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);
}
