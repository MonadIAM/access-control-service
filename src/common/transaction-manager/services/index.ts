import { ClassProvider } from "@nestjs/common";

import { TransactionalService } from "./transactional.service";
import { TRANSACTIONAL_SERVICE } from "./tokens";

export const TRANSACTION_MANAGER_SERVICES: ClassProvider[] = [
    {
        provide: TRANSACTIONAL_SERVICE,
        useClass: TransactionalService,
    },
];

export { TRANSACTIONAL_SERVICE };
