import { Provider } from "@nestjs/common";

import { JWTService } from "./jwt.service";
import { JWT_SERVICE } from "./tokens";

export const COMMON_SERVICES: Provider[] = [
    {
        provide: JWT_SERVICE,
        useClass: JWTService,
    },
];

export { JWT_SERVICE };
