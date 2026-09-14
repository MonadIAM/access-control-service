import { ClassProvider } from "@nestjs/common";

import { INBOX_SERVICE, LOG_MASKING_SERVICE, OUTBOX_SERVICE, TRANSACTIONAL_SERVICE } from "./tokens";
import { TransactionalService } from "./transactional.service";
import { LogMaskingService } from "./log-masking.service";
import { OutboxService } from "./outbox.service";
import { InboxService } from "./inbox.service";

export const TRANSACTION_MANAGER_SERVICES: ClassProvider[] = [
    {
        provide: TRANSACTIONAL_SERVICE,
        useClass: TransactionalService,
    },
    {
        provide: LOG_MASKING_SERVICE,
        useClass: LogMaskingService,
    },
    {
        provide: OUTBOX_SERVICE,
        useClass: OutboxService,
    },
    {
        provide: INBOX_SERVICE,
        useClass: InboxService,
    },
];

export { TRANSACTIONAL_SERVICE, LOG_MASKING_SERVICE, OUTBOX_SERVICE, INBOX_SERVICE };
