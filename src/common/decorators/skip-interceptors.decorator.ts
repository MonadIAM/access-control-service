import { SetMetadata } from "@nestjs/common";

import { SKIP_INTERCEPTORS } from "./tokens";

export function SkipInterceptors(): MethodDecorator & ClassDecorator {
    return SetMetadata(SKIP_INTERCEPTORS, true);
}
