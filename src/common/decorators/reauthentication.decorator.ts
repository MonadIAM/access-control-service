import { SetMetadata } from "@nestjs/common";

import { REAUTHENTICATION } from "./tokens";

export function Reauthentication(): MethodDecorator {
    return SetMetadata(REAUTHENTICATION, true);
}
