import { SetMetadata } from "@nestjs/common";

import { PermissionCode } from "~context/enums";

import { REQUIRE_PERMISSION } from "./tokens";

export function RequirePermission(...permissions: PermissionCode[]): MethodDecorator & ClassDecorator {
    return SetMetadata(REQUIRE_PERMISSION, permissions);
}
