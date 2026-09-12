import type { ChangeLogSubscriber } from "~common/transaction-manager/subscribers/change-log.subscriber";
import type { OperationContext } from "~common/transaction-manager/utilities";

declare global {
    namespace Unit {
        namespace TransactionManager {
            namespace Subscriber {
                interface Contract extends Unit.Domain.Core.Contract {
                    readonly flushSingleChangeLog: FlushSingleChangeLogFactory.Signature;
                    readonly logMaskingContract: LogMaskingContractFactory.Signature;
                    readonly operationContext: OperationContextFactory.Signature;
                    readonly subscriber: ChangeLogSubscriberFactory.Signature;
                    readonly outboxContract: OutboxContractFactory.Signature;
                    readonly flushEventArgs: FlushEventArgsFactory.Signature;
                    readonly changeSet: ChangeSetFactory.Signature;
                    readonly uow: UnitOfWorkFactory.Signature;
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
                        readonly logMasking?: LogMaskingContractFactory.Result;
                        readonly outbox?: OutboxContractFactory.Result;
                        readonly operationContext?: OperationContext;
                    };

                    type Result = {
                        readonly logMasking: LogMaskingContractFactory.Result;
                        readonly outbox: OutboxContractFactory.Result;
                        readonly operationContext: OperationContext;
                        readonly subscriber: ChangeLogSubscriber;
                    };

                    type Signature = (props?: Props) => Result;
                }

                namespace ChangeSetFactory {
                    type Props = {
                        readonly originalEntity?: UnknownObject;
                        readonly type?: ORM.ChangeSetType;
                        readonly payload?: UnknownObject;
                        readonly primaryKey?: unknown;
                        readonly className?: string;
                    };

                    type Result = ORM.ChangeSet<ORM.AnyEntity>;

                    type Signature = (props?: Props) => Result;
                }

                namespace UnitOfWorkFactory {
                    type Props = {
                        readonly changeSets?: ORM.ChangeSet<ORM.AnyEntity>[];
                    };

                    type Result = {
                        readonly computeChangeSet: Unit.Domain.Mock;
                        readonly getChangeSets: Unit.Domain.Mock;
                        readonly uow: ORM.UnitOfWork;
                    };

                    type Signature = (props?: Props) => Result;
                }

                namespace FlushEventArgsFactory {
                    type Props = {
                        readonly em: ORM.EntityManager;
                        readonly uow: ORM.UnitOfWork;
                    };

                    type Result = ORM.FlushEventArgs;

                    type Signature = (props: Props) => Result;
                }

                namespace FlushSingleChangeLogFactory {
                    type Props = {
                        readonly changeSet: ORM.ChangeSet<ORM.AnyEntity>;
                    };

                    type Result = Promise<SystemEntities.ChangeLog>;

                    type Signature = (props: Props) => Result;
                }
            }
        }
    }
}
