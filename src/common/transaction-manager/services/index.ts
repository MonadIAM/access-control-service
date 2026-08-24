import { ClassProvider } from "@nestjs/common";

import { LOG_MASKING_SERVICE, TRANSACTIONAL_SERVICE } from "./tokens";
import { TransactionalService } from "./transactional.service";
import { LogMaskingService } from "./log-masking.service";

export const TRANSACTION_MANAGER_SERVICES: ClassProvider[] = [
    {
        provide: TRANSACTIONAL_SERVICE,
        useClass: TransactionalService,
    },
    {
        provide: LOG_MASKING_SERVICE,
        useClass: LogMaskingService,
    },
];

export { TRANSACTIONAL_SERVICE, LOG_MASKING_SERVICE };
