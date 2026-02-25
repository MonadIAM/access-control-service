import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = Symbol("is-public");

export function Public(): MethodDecorator & ClassDecorator {
    return SetMetadata(IS_PUBLIC_KEY, true);
}
