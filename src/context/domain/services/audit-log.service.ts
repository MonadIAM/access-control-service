import { Inject, Injectable, Scope } from "@nestjs/common";

import { AUDIT_LOG_REPOSITORY } from "../repositories";

@Injectable({ scope: Scope.DEFAULT })
export class AuditLogService implements Services.AuditLog.Contract {
    public constructor(
        @Inject(AUDIT_LOG_REPOSITORY)
        private readonly auditLogRepository: Repositories.AuditLog.Contract,
    ) {}

    public async purgeExpired(props: Services.AuditLog.PurgeExpired.Props): Services.AuditLog.PurgeExpired.Result {
        const { transaction, expirationDate, batchSize } = props;

        const expired = await this.auditLogRepository.find({
            where: { createdAt: { $lt: expirationDate } },
            options: { limit: batchSize },
            transaction,
        });

        for (const entry of expired) {
            transaction.remove(entry);
        }

        return expired;
    }
}
