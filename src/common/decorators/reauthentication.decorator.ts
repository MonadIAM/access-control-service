import { SetMetadata } from "@nestjs/common";

import { REAUTHENTICATION } from "./tokens";

export function Reauthentication(options: Reauthentication.Options = {}): MethodDecorator {
    return SetMetadata(REAUTHENTICATION, options);
}
