import { Provider } from "@nestjs/common";

import { TransactionalService } from "./transactional.service";

export const TRANSACTIONAL_SERVICE = Symbol("Services.Transactional.Contract");

export const TRACKING_SERVICES: Provider[] = [
    {
        provide: TRANSACTIONAL_SERVICE,
        useClass: TransactionalService,
    },
];
