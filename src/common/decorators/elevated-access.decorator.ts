import { SetMetadata } from "@nestjs/common";

import { ELEVATED_ACCESS } from "./tokens";

export function ElevatedAccess(): MethodDecorator {
    return SetMetadata(ELEVATED_ACCESS, true);
}
