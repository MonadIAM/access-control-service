import { SetMetadata } from "@nestjs/common";

import { IS_PUBLIC } from "./tokens";

export function Public(): MethodDecorator & ClassDecorator {
    return SetMetadata(IS_PUBLIC, true);
}
