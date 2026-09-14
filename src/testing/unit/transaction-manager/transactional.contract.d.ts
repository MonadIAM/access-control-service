import type { TransactionalService } from "~common/transaction-manager/services/transactional.service";
import type { OperationContext } from "~common/transaction-manager/utilities";
import type { KafkaTopic } from "~context/enums";

declare global {
    namespace Unit {
        namespace TransactionManager {
            namespace Service {
                interface Contract extends Unit.Domain.Core.Contract {
                    readonly accessCacheOutboxConfig: AccessCacheOutboxConfigFactory.Signature;
                    readonly logMaskingContract: LogMaskingContractFactory.Signature;
                    readonly operationContext: OperationContextFactory.Signature;
                    readonly outboxContract: OutboxContractFactory.Signature;
                    readonly service: TransactionalServiceFactory.Signature;
                    readonly inboxContract: InboxContractFactory.Signature;
                    readonly transactional: TransactionalFactory.Signature;
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

                namespace InboxContractFactory {
                    type Props = Partial<Result>;

                    type Result = globalThis.TransactionManager.Inbox.Contract;

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

                namespace TransactionalFactory {
                    type Callback = (transaction: ORM.EntityManager) => Thenable<unknown>;

                    type Result = {
                        readonly entityManager: ORM.EntityManager;
                        readonly transactional: Unit.Domain.Mock;
                        readonly transaction: ORM.EntityManager;
                        readonly persist: Unit.Domain.Mock;
                        readonly flush: Unit.Domain.Mock;
                        readonly fork: Unit.Domain.Mock;
                    };

                    type Signature = () => Result;
                }

                namespace AccessCacheOutboxConfigFactory {
                    type Result<T extends ORM.AnyEntity | ORM.AnyEntity[]> = {
                        payloadMapper(result: T): Topics.AccessCache.Message["payload"];

                        readonly destinationTopic: KafkaTopic.ACCESS_CACHE;
                        readonly actionType: string;
                    };

                    type Signature = <T extends ORM.AnyEntity | ORM.AnyEntity[]>() => Result<T>;
                }

                namespace TransactionalServiceFactory {
                    type Props = {
                        readonly logMasking?: LogMaskingContractFactory.Result;
                        readonly outbox?: OutboxContractFactory.Result;
                        readonly inbox?: InboxContractFactory.Result;
                        readonly operationContext?: OperationContext;
                        readonly manager?: ORM.EntityManager;
                    };

                    type Result = {
                        readonly logMasking: LogMaskingContractFactory.Result;
                        readonly transactional: TransactionalFactory.Result;
                        readonly outbox: OutboxContractFactory.Result;
                        readonly inbox: InboxContractFactory.Result;
                        readonly operationContext: OperationContext;
                        readonly service: TransactionalService;
                    };

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
