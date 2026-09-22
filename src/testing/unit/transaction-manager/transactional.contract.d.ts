import type { TransactionalService } from "~common/transaction-manager/services/transactional.service";
import type { OperationContext } from "~common/transaction-manager/utilities";
import type { KafkaTopic } from "~context/enums";

declare global {
    namespace Unit.TransactionManager.Service {
        interface Contract extends Unit.Domain.Core.Contract {
            accessCacheOutboxConfig: AccessCacheOutboxConfigFactory.Signature;
            logMaskingContract: LogMaskingContractFactory.Signature;
            operationContext: OperationContextFactory.Signature;
            outboxContract: OutboxContractFactory.Signature;
            service: TransactionalServiceFactory.Signature;
            inboxContract: InboxContractFactory.Signature;
            transactional: TransactionalFactory.Signature;
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
                entityManager: ORM.EntityManager;
                transaction: ORM.EntityManager;
                transactional: Jest.Mock<(callback: Callback) => Promise<unknown>>;
                persist: Jest.Mock<(entity: object) => void>;
                fork: Jest.Mock<() => ORM.EntityManager>;
                flush: Jest.Mock<() => Promise<void>>;
            };

            type Signature = () => Result;
        }

        namespace AccessCacheOutboxConfigFactory {
            type Result<T extends ORM.AnyEntity | ORM.AnyEntity[]> = {
                payloadMapper(result: T): Topics.AccessCache.Message["payload"];

                destinationTopic: KafkaTopic.ACCESS_CACHE;
                actionType: string;
            };

            type Signature = <T extends ORM.AnyEntity | ORM.AnyEntity[]>() => Result<T>;
        }

        namespace TransactionalServiceFactory {
            type Props = {
                logMasking?: LogMaskingContractFactory.Result;
                outbox?: OutboxContractFactory.Result;
                inbox?: InboxContractFactory.Result;
                operationContext?: OperationContext;
                manager?: ORM.EntityManager;
            };

            type Result = {
                logMasking: LogMaskingContractFactory.Result;
                transactional: TransactionalFactory.Result;
                outbox: OutboxContractFactory.Result;
                inbox: InboxContractFactory.Result;
                operationContext: OperationContext;
                service: TransactionalService;
            };

            type Signature = (props?: Props) => Result;
        }
    }
}
