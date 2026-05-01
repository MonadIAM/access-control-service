import { SetMetadata } from "@nestjs/common";

export const SKIP_INTERCEPTORS_KEY = Symbol("skip-interceptors");

export function SkipInterceptors(): MethodDecorator & ClassDecorator {
    return SetMetadata(SKIP_INTERCEPTORS_KEY, true);
}
