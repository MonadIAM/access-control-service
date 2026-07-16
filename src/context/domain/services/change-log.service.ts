import { Injectable, Scope } from "@nestjs/common";

import { ChangeLog } from "~common/transaction-manager";

@Injectable({ scope: Scope.DEFAULT })
export class ChangeLogService implements Services.ChangeLog.Contract {
    public async purgeExpired(props: Services.ChangeLog.PurgeExpired.Props): Services.ChangeLog.PurgeExpired.Result {
        const { transaction, expirationDate, batchSize } = props;

        const expired = await transaction.find(ChangeLog, { createdAt: { $lt: expirationDate } }, { limit: batchSize });

        for (const entry of expired) {
            transaction.remove(entry);
        }

        return expired;
    }
}
