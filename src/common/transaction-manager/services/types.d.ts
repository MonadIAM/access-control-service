import { KafkaTopic } from "~context/enums";

declare global {
    namespace TransactionManager {
        namespace Service {
            interface Contract extends PublicContract, InternalContract {}

            interface InternalContract {
                buildAuditLogArchiveOutbox: BuildAuditLogArchiveOutbox.Signature;
                persistOutboxEvents: PersistOutboxEvents.Signature;
                executeWithEffects: ExecuteWithEffects.Signature;
            }

            namespace BuildAuditLogArchiveOutbox {
                type Props = SystemEntities.AuditLog;

                type Result = SystemEntities.Outbox;

                type Signature = (props: Props) => Result;
            }

            namespace PersistOutboxEvents {
                type Props<T extends ORM.AnyEntity | ORM.AnyEntity[]> = {
                    params: TransactionManager.Service.Run.Props<T>;
                    transaction: ORM.EntityManager;
                    result: T;
                };

                type Result = void;

                type Signature = <T extends ORM.AnyEntity | ORM.AnyEntity[]>(props: Props<T>) => Result;
            }

            namespace ExecuteWithEffects {
                type Props<T extends ORM.AnyEntity | ORM.AnyEntity[]> = {
                    params: TransactionManager.Service.Run.Props<T>;
                    transaction: ORM.EntityManager;
                };

                type Result<T> = Promise<T | void>;

                type Signature = <T extends ORM.AnyEntity | ORM.AnyEntity[]>(props: Props<T>) => Result<T>;
            }

            interface PublicContract {
                run<T extends ORM.AnyEntity | ORM.AnyEntity[]>(props: Run.ResultProps<T>): Promise<T>;
                run(props: Run.VoidProps): Promise<void>;
            }

            namespace Run {
                type ResultProps<T extends ORM.AnyEntity | ORM.AnyEntity[]> = {
                    execute(transaction: ORM.EntityManager): Promise<T> | T;
                    outbox?: OutboxConfig<T> | OutboxConfig<T>[];
                    audit?: SystemEntities.AuditLog.ConstructorProps;
                    changeLog?: boolean;
                    resource?: string;
                };

                type VoidProps = {
                    execute(transaction: ORM.EntityManager): Promise<void> | void;
                    audit?: SystemEntities.AuditLog.ConstructorProps;
                    changeLog?: never;
                    resource?: string;
                    outbox?: never;
                };

                type Props<T extends ORM.AnyEntity | ORM.AnyEntity[]> = ResultProps<T> | VoidProps;

                type Result<T> = Promise<T | void>;
            }

            type OutboxPayloadMap = {
                [KafkaTopic.NOTIFICATION]: Topics.Notification.Message["payload"];
                [KafkaTopic.ACCESS_CACHE]: Topics.AccessCache.Message["payload"];
                [KafkaTopic.MEMBERSHIP]: Topics.Membership.Message["payload"];
                [KafkaTopic.REALM]: Topics.Realm.Message["payload"];
                [KafkaTopic.PROJECTION_JOURNAL]: UnknownObject;
            };

            type OutboxConfig<T> = {
                [D in keyof OutboxPayloadMap]: {
                    payloadMapper?(result: T): OutboxPayloadMap[D] | OutboxPayloadMap[D][];
                    metadata?: UnknownObject;
                    destinationTopic: D;
                    actionType: string;
                };
            }[keyof OutboxPayloadMap];
        }
    }
}
