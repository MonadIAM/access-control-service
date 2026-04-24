import { AnyEntity, EntityManager } from "@mikro-orm/postgresql";
import { InjectEntityManager } from "@mikro-orm/nestjs";
import { Injectable } from "@nestjs/common";

import { ServiceException } from "~common/exceptions";

import { OperationContext } from "../utilities/operation-context";
import { AuditLog } from "../entities/audit-log.entity";
import { Outbox } from "../entities";

@Injectable()
export class TransactionalService {
    public constructor(
        @InjectEntityManager("write")
        private readonly writeManager: EntityManager,
        private readonly operationContext: OperationContext,
    ) {}

    public async run<T extends AnyEntity>(params: TransactionManager.Service.Run<T>): Promise<T | void> {
        try {
            const writeManager = this.writeManager.fork();

            if (!params.audit) {
                return writeManager.transactional(async (transaction) => {
                    const result = await params.execute(transaction);

                    if (params.outbox && result) {
                        const mapper = params.outbox.payloadMapper;
                        const payloads = mapper ? [mapper(result)].flat() : [result].flat();
                        for (const payload of payloads) {
                            transaction.persist(new Outbox({ ...params.outbox, payload }));
                        }
                    }

                    await transaction.flush();

                    return result;
                });
            }

            const auditEntry = new AuditLog(params.audit);

            return await this.operationContext.run(
                {
                    changeLogEnabled: params.changeLog ?? false,
                    auditEntry: auditEntry.id,
                },
                () =>
                    writeManager.transactional(async (transaction) => {
                        transaction.persist(auditEntry);

                        const result = await params.execute(transaction);

                        if (params.outbox && result) {
                            const mapper = params.outbox.payloadMapper;
                            const payloads = mapper ? [mapper(result)].flat() : [result].flat();
                            for (const payload of payloads) {
                                transaction.persist(new Outbox({ ...params.outbox, payload }));
                            }
                        }

                        await transaction.flush();

                        return result;
                    }),
            );
        } catch (error) {
            throw ServiceException.fromOrmError(error, params.resource);
        }
    }
}
