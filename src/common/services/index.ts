import { Provider } from "@nestjs/common";

import { JWTService } from "./jwt.service";

export const JWT_SERVICE = Symbol("Services.JWT.Contract");

export const COMMON_SERVICES: Provider[] = [
    {
        provide: JWT_SERVICE,
        useClass: JWTService,
    },
];
