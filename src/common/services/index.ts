import { ClassProvider } from "@nestjs/common";

import { VaultTransitService } from "./vault-transit.service";
import { JWTService } from "./jwt.service";
import { VAULT_TRANSIT_SERVICE, JWT_SERVICE } from "./tokens";

export const COMMON_SERVICES: ClassProvider[] = [
    {
        provide: VAULT_TRANSIT_SERVICE,
        useClass: VaultTransitService,
    },
    {
        provide: JWT_SERVICE,
        useClass: JWTService,
    },
];

export { VAULT_TRANSIT_SERVICE, JWT_SERVICE };
