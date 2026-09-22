import { ChangeSetType } from "@mikro-orm/postgresql";
import { jest } from "@jest/globals";

import { ChangeLogSubscriber } from "~common/transaction-manager/subscribers/change-log.subscriber";
import { OperationContext } from "~common/transaction-manager/utilities";
import { Outbox } from "~common/transaction-manager/entities";
import { KafkaTopic } from "~context/enums";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class ChangeLogSubscriberUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.TransactionManager.Subscriber.Contract
{
    public operationContext(): Unit.TransactionManager.Subscriber.OperationContextFactory.Result {
        return new OperationContext();
    }

    public logMaskingContract(
        props: Unit.TransactionManager.Subscriber.LogMaskingContractFactory.Props = {},
    ): Unit.TransactionManager.Subscriber.LogMaskingContractFactory.Result {
        return this.contract<Unit.TransactionManager.Subscriber.LogMaskingContractFactory.Result>({
            maskChangeLog: jest.fn(({ delta }: TransactionManager.LogMasking.MaskChangeLog.Props) =>
                Promise.resolve(delta),
            ),
            maskAuditLog: jest.fn(({ input }: TransactionManager.LogMasking.MaskAuditLog.Props) => Promise.resolve(input)),
            sign: jest.fn(() => Promise.resolve({ keyVersion: 1, signature: "signature" })),
            normalize: jest.fn(),
            unflatten: jest.fn(),
            flatten: jest.fn(),
            mask: jest.fn(),
            ...props,
        });
    }

    public outboxContract(
        props: Unit.TransactionManager.Subscriber.OutboxContractFactory.Props = {},
    ): Unit.TransactionManager.Subscriber.OutboxContractFactory.Result {
        return this.contract<Unit.TransactionManager.Subscriber.OutboxContractFactory.Result>({
            build: jest.fn((buildProps: TransactionManager.Outbox.Build.Props) => new Outbox(buildProps)),
            buildAuditLogArchive: jest.fn(
                (audit: TransactionManager.Outbox.BuildAuditLogArchive.Props) =>
                    new Outbox({
                        destinationTopic: KafkaTopic.AUDIT_LOG_ARCHIVE,
                        payload: { id: audit.id },
                        actionType: "ARCHIVE",
                    }),
            ),
            buildChangeLogArchive: jest.fn(
                (change: TransactionManager.Outbox.BuildChangeLogArchive.Props) =>
                    new Outbox({
                        destinationTopic: KafkaTopic.CHANGE_LOG_ARCHIVE,
                        payload: { id: change.id },
                        actionType: "ARCHIVE",
                    }),
            ),
            ...props,
        });
    }

    public subscriber(
        props: Unit.TransactionManager.Subscriber.ChangeLogSubscriberFactory.Props = {},
    ): Unit.TransactionManager.Subscriber.ChangeLogSubscriberFactory.Result {
        const operationContext = props.operationContext ?? this.operationContext();
        const logMasking = props.logMasking ?? this.logMaskingContract();
        const outbox = props.outbox ?? this.outboxContract();
        const subscriber = new ChangeLogSubscriber(logMasking, outbox, operationContext);

        return { subscriber, operationContext, logMasking, outbox };
    }

    public changeSet(
        props: Unit.TransactionManager.Subscriber.ChangeSetFactory.Props = {},
    ): Unit.TransactionManager.Subscriber.ChangeSetFactory.Result {
        return this.contract<Unit.TransactionManager.Subscriber.ChangeSetFactory.Result>({
            getPrimaryKey: jest.fn(() => props.primaryKey ?? "00000000-0000-4000-8000-000000000001"),
            payload: props.payload ?? { name: "New Name" },
            meta: { className: props.className ?? "Role" },
            type: props.type ?? ChangeSetType.UPDATE,
            originalEntity: props.originalEntity,
            entity: props.entity,
        });
    }

    public uow(
        props: Unit.TransactionManager.Subscriber.UnitOfWorkFactory.Props = {},
    ): Unit.TransactionManager.Subscriber.UnitOfWorkFactory.Result {
        const getChangeSets = jest.fn(() => props.changeSets ?? []);
        const computeChangeSet = jest.fn<(entity: object) => void>();

        return {
            uow: this.contract<Unit.TransactionManager.Subscriber.UnitOfWorkFactory.Result["uow"]>({
                computeChangeSet,
                getChangeSets,
            }),
            computeChangeSet,
            getChangeSets,
        };
    }

    public flushEventArgs(
        props: Unit.TransactionManager.Subscriber.FlushEventArgsFactory.Props,
    ): Unit.TransactionManager.Subscriber.FlushEventArgsFactory.Result {
        return this.contract<ORM.FlushEventArgs>(props);
    }

    public async flushSingleChangeLog(
        props: Unit.TransactionManager.Subscriber.FlushSingleChangeLogFactory.Props,
    ): Unit.TransactionManager.Subscriber.FlushSingleChangeLogFactory.Result {
        const operationContext = this.operationContext();
        const { subscriber } = this.subscriber({ operationContext });
        const uow = this.uow({ changeSets: [props.changeSet] });
        const transaction = this.transaction();

        await operationContext.run({ changeLogEnabled: true, auditEntry: "audit-entry" }, () =>
            subscriber.onFlush(this.flushEventArgs({ uow: uow.uow, em: transaction.entityManager })),
        );

        return this.contract<SystemEntities.ChangeLog>(transaction.persist.mock.calls[0][0]);
    }
}
