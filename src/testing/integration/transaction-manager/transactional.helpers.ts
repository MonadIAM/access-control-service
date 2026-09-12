import { expect } from "@jest/globals";

import { TransactionalService } from "~common/transaction-manager/services/transactional.service";
import { AuditLog, ChangeLog, Outbox } from "~common/transaction-manager/entities";
import { ChangeLogSubscriber } from "~common/transaction-manager/subscribers";
import { OperationContext } from "~common/transaction-manager/utilities";
import { Realm, Role } from "~context/domain/entities";
import { KafkaTopic } from "~context/enums";

export class TransactionalHelper implements Integration.TransactionalHelper.Contract {
    public createLogMaskingService(
        overrides: Integration.TransactionalHelper.CreateLogMaskingService.Props = {},
    ): Integration.TransactionalHelper.CreateLogMaskingService.Result {
        return {
            sign: ({ entity }) =>
                Promise.resolve({ keyVersion: 7, signature: `signed:${entity.constructor.name}:${entity.id}` }),
            maskAuditLog: ({ input }) =>
                Promise.resolve(
                    Object.fromEntries(
                        Object.entries(input).map(([key, value]) => [
                            key,
                            key.toLowerCase().includes("password") ? `masked:${value}` : value,
                        ]),
                    ),
                ),
            maskChangeLog: ({ delta }) => Promise.resolve(delta),
            ...overrides,
        } as TransactionManager.LogMasking.Contract;
    }

    public createOutboxService(
        overrides: Integration.TransactionalHelper.CreateOutboxService.Props = {},
    ): Integration.TransactionalHelper.CreateOutboxService.Result {
        return {
            build: (props) => new Outbox(props),
            buildAuditLogArchive: (audit) =>
                new Outbox({
                    payload: { id: audit.id, input: audit.input ?? null },
                    destinationTopic: KafkaTopic.AUDIT_LOG_ARCHIVE,
                    actionType: "ARCHIVE",
                }),
            buildChangeLogArchive: (change) =>
                new Outbox({
                    payload: { id: change.id, auditEntry: change.auditEntry },
                    destinationTopic: KafkaTopic.CHANGE_LOG_ARCHIVE,
                    actionType: "ARCHIVE",
                }),
            ...overrides,
        };
    }

    public createTransactionalServiceContext(
        props: Integration.TransactionalHelper.CreateTransactionalServiceContext.Props,
    ): Integration.TransactionalHelper.CreateTransactionalServiceContext.Result {
        const operationContext = new OperationContext();
        const writeManager = props.orm.em.fork({ freshEventManager: true });
        const readManager = props.orm.em.fork();

        const logMaskingService = props.logMaskingService ?? this.createLogMaskingService();
        const outboxService = props.outboxService ?? this.createOutboxService();

        writeManager
            .getEventManager()
            .registerSubscriber(new ChangeLogSubscriber(logMaskingService, outboxService, operationContext));

        return {
            service: new TransactionalService(writeManager, logMaskingService, outboxService, operationContext),
            operationContext,
            orm: props.orm,
            readManager,
        };
    }

    public async expectNoTransactionRows(
        readManager: Integration.TransactionalHelper.ExpectNoTransactionRows.Props,
    ): Integration.TransactionalHelper.ExpectNoTransactionRows.Result {
        readManager.clear();
        await expect(readManager.count(AuditLog, {})).resolves.toBe(0);
        await expect(readManager.count(ChangeLog, {})).resolves.toBe(0);
        await expect(readManager.count(Outbox, {})).resolves.toBe(0);
        await expect(readManager.count(Realm, {})).resolves.toBe(0);
        await expect(readManager.count(Role, {})).resolves.toBe(0);
    }
}
