import { Injectable, Scope } from "@nestjs/common";

import { AuditLog } from "~common/transaction-manager";

@Injectable({ scope: Scope.DEFAULT })
export class AuditLogService implements Services.AuditLog.Contract {
    public async purgeExpired(props: Services.AuditLog.PurgeExpired.Props): Services.AuditLog.PurgeExpired.Result {
        const { transaction, expirationDate, batchSize } = props;

        const expired = await transaction.find(AuditLog, { createdAt: { $lt: expirationDate } }, { limit: batchSize });

        for (const entry of expired) {
            transaction.remove(entry);
        }

        return expired;
    }
}
