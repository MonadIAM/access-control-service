import { Provider } from "@nestjs/common";

import { TransactionalService } from "./transactional.service";

export const TRANSACTIONAL_SERVICE = Symbol("Services.TransactionManager.Contract");

export const TRANSACTION_MANAGER_SERVICES: Provider[] = [
    {
        provide: TRANSACTIONAL_SERVICE,
        useClass: TransactionalService,
    },
];
