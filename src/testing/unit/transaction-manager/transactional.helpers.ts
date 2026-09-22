import { AccessCacheTopicAction, InvalidationScope } from "@monadiam/shared";
import { jest } from "@jest/globals";

import { TransactionalService } from "~common/transaction-manager/services/transactional.service";
import { OperationContext } from "~common/transaction-manager/utilities";
import { Outbox } from "~common/transaction-manager/entities";
import { KafkaTopic } from "~context/enums";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

export class TransactionalUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.TransactionManager.Service.Contract
{
    public operationContext(): Unit.TransactionManager.Service.OperationContextFactory.Result {
        return new OperationContext();
    }

    public logMaskingContract(
        props: Unit.TransactionManager.Service.LogMaskingContractFactory.Props = {},
    ): Unit.TransactionManager.Service.LogMaskingContractFactory.Result {
        return this.contract<Unit.TransactionManager.Service.LogMaskingContractFactory.Result>({
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
        props: Unit.TransactionManager.Service.OutboxContractFactory.Props = {},
    ): Unit.TransactionManager.Service.OutboxContractFactory.Result {
        return this.contract<Unit.TransactionManager.Service.OutboxContractFactory.Result>({
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

    public inboxContract(
        props: Unit.TransactionManager.Service.InboxContractFactory.Props = {},
    ): Unit.TransactionManager.Service.InboxContractFactory.Result {
        return this.contract<Unit.TransactionManager.Service.InboxContractFactory.Result>({
            claim: jest.fn(() => Promise.resolve(true)),
            clean: jest.fn(() => Promise.resolve(0)),
            ...props,
        });
    }

    public transactional(): Unit.TransactionManager.Service.TransactionalFactory.Result {
        const flush = jest.fn(() => Promise.resolve());
        const persist = jest.fn<(entity: object) => void>();
        const fork = jest.fn<() => ORM.EntityManager>();

        const transaction = this.contract<ORM.EntityManager>({ persist, flush });
        const transactional = jest.fn((callback: Unit.TransactionManager.Service.TransactionalFactory.Callback) =>
            Promise.resolve(callback(transaction)),
        );
        const entityManager = this.contract<ORM.EntityManager>({ fork, transactional });

        fork.mockReturnValue(entityManager);

        return { entityManager, transaction, transactional, persist, flush, fork };
    }

    public service(
        props: Unit.TransactionManager.Service.TransactionalServiceFactory.Props = {},
    ): Unit.TransactionManager.Service.TransactionalServiceFactory.Result {
        const transactional = this.transactional();
        const operationContext = props.operationContext ?? this.operationContext();
        const logMasking = props.logMasking ?? this.logMaskingContract();
        const outbox = props.outbox ?? this.outboxContract();
        const inbox = props.inbox ?? this.inboxContract();
        const service = new TransactionalService(
            props.manager ?? transactional.entityManager,
            inbox,
            logMasking,
            outbox,
            operationContext,
        );

        return { service, operationContext, transactional, logMasking, outbox, inbox };
    }

    public accessCacheOutboxConfig<
        T extends ORM.AnyEntity | ORM.AnyEntity[],
    >(): Unit.TransactionManager.Service.AccessCacheOutboxConfigFactory.Result<T> {
        return {
            destinationTopic: KafkaTopic.ACCESS_CACHE,
            actionType: AccessCacheTopicAction.INVALIDATE,
            payloadMapper: () => ({
                items: [{ scope: InvalidationScope.GLOBAL }],
            }),
        };
    }
}
