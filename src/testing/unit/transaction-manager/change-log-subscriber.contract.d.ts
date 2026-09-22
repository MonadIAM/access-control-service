import type { ChangeLogSubscriber } from "~common/transaction-manager/subscribers/change-log.subscriber";
import type { OperationContext } from "~common/transaction-manager/utilities";

declare global {
    namespace Unit.TransactionManager.Subscriber {
        interface Contract extends Unit.Domain.Core.Contract {
            flushSingleChangeLog: FlushSingleChangeLogFactory.Signature;
            logMaskingContract: LogMaskingContractFactory.Signature;
            operationContext: OperationContextFactory.Signature;
            subscriber: ChangeLogSubscriberFactory.Signature;
            outboxContract: OutboxContractFactory.Signature;
            flushEventArgs: FlushEventArgsFactory.Signature;
            changeSet: ChangeSetFactory.Signature;
            uow: UnitOfWorkFactory.Signature;
        }

        namespace OperationContextFactory {
            type Result = OperationContext;

            type Signature = () => Result;
        }

        namespace LogMaskingContractFactory {
            type Props = Partial<Result>;

            type Result = globalThis.TransactionManager.LogMasking.Contract;

            type Signature = (props?: Props) => Result;
        }

        namespace OutboxContractFactory {
            type Props = Partial<Result>;

            type Result = {
                buildChangeLogArchive(props: SystemEntities.ChangeLog): SystemEntities.Outbox;
                buildAuditLogArchive(props: SystemEntities.AuditLog): SystemEntities.Outbox;
                build(props: SystemEntities.Outbox.ConstructorProps): SystemEntities.Outbox;
            };

            type Signature = (props?: Props) => Result;
        }

        namespace ChangeLogSubscriberFactory {
            type Props = {
                logMasking?: LogMaskingContractFactory.Result;
                outbox?: OutboxContractFactory.Result;
                operationContext?: OperationContext;
            };

            type Result = {
                logMasking: LogMaskingContractFactory.Result;
                outbox: OutboxContractFactory.Result;
                operationContext: OperationContext;
                subscriber: ChangeLogSubscriber;
            };

            type Signature = (props?: Props) => Result;
        }

        namespace ChangeSetFactory {
            type Props = {
                originalEntity?: UnknownObject;
                type?: ORM.ChangeSetType;
                payload?: UnknownObject;
                entity?: UnknownObject;
                primaryKey?: unknown;
                className?: string;
            };

            type Result = ORM.ChangeSet<ORM.AnyEntity>;

            type Signature = (props?: Props) => Result;
        }

        namespace UnitOfWorkFactory {
            type Props = {
                changeSets?: ORM.ChangeSet<ORM.AnyEntity>[];
            };

            type Result = {
                getChangeSets: Jest.Mock<ORM.UnitOfWork["getChangeSets"]>;
                computeChangeSet: Jest.Mock<(entity: object) => void>;
                uow: ORM.UnitOfWork;
            };

            type Signature = (props?: Props) => Result;
        }

        namespace FlushEventArgsFactory {
            type Props = {
                em: ORM.EntityManager;
                uow: ORM.UnitOfWork;
            };

            type Result = ORM.FlushEventArgs;

            type Signature = (props: Props) => Result;
        }

        namespace FlushSingleChangeLogFactory {
            type Props = {
                changeSet: ORM.ChangeSet<ORM.AnyEntity>;
            };

            type Result = Promise<SystemEntities.ChangeLog>;

            type Signature = (props: Props) => Result;
        }
    }
}
