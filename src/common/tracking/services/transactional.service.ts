import { InjectEntityManager } from "@mikro-orm/nestjs";
import { EntityManager } from "@mikro-orm/postgresql";
import { Injectable } from "@nestjs/common";

import { OperationContext } from "../utilities/operation-context";
import { AuditLog } from "../entities/audit-log.entity";

@Injectable()
export class TransactionalService {
    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        private readonly operationContext: OperationContext,
    ) {}

    public run<T>(params: Tracking.Transactional.Run<T>): Promise<T> {
        const writeManager = this.writeManager.fork();

        if (!params.audit) {
            return writeManager.transactional(async (transaction) => {
                const result = await params.execute(transaction);
                await transaction.flush();
                return result;
            });
        }

        const auditEntry = new AuditLog(params.audit);

        return this.operationContext.run(
            {
                auditEntry: auditEntry.id,
                changeLogEnabled: params.changeLog ?? false,
            },
            () =>
                writeManager.transactional(async (transaction) => {
                    transaction.persist(auditEntry);

                    const result = await params.execute(transaction);

                    await transaction.flush();

                    return result;
                }),
        );
    }
}
