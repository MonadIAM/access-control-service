import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable } from "@nestjs/common";

import { ServiceException } from "~common/exceptions";

import { OperationContext } from "../utilities/operation-context";
import { AuditLog } from "../entities/audit-log.entity";

@Injectable()
export class TransactionalService {
    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        private readonly operationContext: OperationContext,
    ) {}

    public async run<T>(params: Tracking.Transactional.Run<T>): Promise<T> {
        try {
            const writeManager = this.writeManager.fork();

            if (!params.audit) {
                return writeManager.transactional(async (transaction) => {
                    const result = await params.execute(transaction);
                    await transaction.flush();
                    return result;
                });
            }

            const auditEntry = new AuditLog(params.audit);

            return await this.operationContext.run(
                {
                    auditEntry: auditEntry.id,
                    changeLogEnabled: Boolean(params.changeLog),
                },
                () =>
                    writeManager.transactional(async (transaction) => {
                        transaction.persist(auditEntry);

                        const result = await params.execute(transaction);

                        await transaction.flush();

                        return result;
                    }),
            );
        } catch (error) {
            throw ServiceException.fromOrmError(error, params.resource);
        }
    }
}
