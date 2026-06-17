import { SetMetadata } from "@nestjs/common";

import { PermissionCode } from "~context/enums";

import { REQUIRE_GLOBAL_PERMISSION } from "./tokens";

export function RequireGlobalPermission(...permissions: PermissionCode[]): MethodDecorator & ClassDecorator {
    return SetMetadata(REQUIRE_GLOBAL_PERMISSION, permissions);
}
