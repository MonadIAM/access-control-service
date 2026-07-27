import { Inject, Injectable, Scope } from "@nestjs/common";

import { CHANGE_LOG_REPOSITORY } from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class ChangeLogService implements Services.ChangeLog.Contract {
    public constructor(
        @Inject(CHANGE_LOG_REPOSITORY)
        private readonly changeLogRepository: Repositories.ChangeLog.Contract,
    ) {}

    public async purgeExpired(props: Services.ChangeLog.PurgeExpired.Props): Services.ChangeLog.PurgeExpired.Result {
        const { transaction, expirationDate, batchSize } = props;

        const expired = await this.changeLogRepository.find({
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
