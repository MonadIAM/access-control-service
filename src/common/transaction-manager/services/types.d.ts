import { AnyEntity, EntityManager } from "@mikro-orm/postgresql";

import { KafkaTopic } from "~context/enums";

declare global {
    namespace TransactionManager {
        namespace Service {
            interface PublicContract {
                run<T extends AnyEntity | AnyEntity[]>(props: Run.ResultProps<T>): Promise<T>;
                run(props: Run.VoidProps): Promise<void>;
            }

            interface PrivateContract {
                buildAuditLogArchiveOutbox(props: BuildAuditLogArchiveOutbox.Props): BuildAuditLogArchiveOutbox.Result;
                executeWithEffects<T extends AnyEntity | AnyEntity[]>(
                    props: ExecuteWithEffects.Props<T>,
                ): ExecuteWithEffects.Result<T>;
                persistOutboxEvents<T extends AnyEntity | AnyEntity[]>(
                    props: PersistOutboxEvents.Props<T>,
                ): PersistOutboxEvents.Result;
            }

            interface Contract extends PublicContract, PrivateContract {}

            type OutboxPayloadMap = {
                [KafkaTopic.ACCESS_CACHE]: Topics.AccessCache.Message["payload"];
                [KafkaTopic.MEMBERSHIP]: Topics.Membership.Message["payload"];
                [KafkaTopic.PROJECTION_JOURNAL]: UnknownObject;
                [KafkaTopic.REALM]: Topics.Realm.Message["payload"];
            };

            type OutboxConfig<T> = {
                [D in keyof OutboxPayloadMap]: {
                    payloadMapper?(result: T): OutboxPayloadMap[D] | OutboxPayloadMap[D][];
                    metadata?: UnknownObject;
                    destinationTopic: D;
                    actionType: string;
                };
            }[keyof OutboxPayloadMap];

            namespace Run {
                type ResultProps<T extends AnyEntity | AnyEntity[]> = {
                    execute(transaction: EntityManager): Promise<T> | T;
                    outbox?: OutboxConfig<T> | OutboxConfig<T>[];
                    audit?: SystemEntities.AuditLog.ConstructorProps;
                    changeLog?: boolean;
                    resource?: string;
                };

                type VoidProps = {
                    execute(transaction: EntityManager): Promise<void> | void;
                    audit?: SystemEntities.AuditLog.ConstructorProps;
                    changeLog?: never;
                    resource?: string;
                    outbox?: never;
                };

                type Props<T extends AnyEntity | AnyEntity[]> = ResultProps<T> | VoidProps;

                type Result<T> = Promise<T | void>;
            }

            namespace ExecuteWithEffects {
                type Props<T extends AnyEntity | AnyEntity[]> = {
                    params: TransactionManager.Service.Run.Props<T>;
                    transaction: EntityManager;
                };

                type Result<T> = Promise<T | void>;
            }

            namespace PersistOutboxEvents {
                type Props<T extends AnyEntity | AnyEntity[]> = {
                    params: TransactionManager.Service.Run.Props<T>;
                    transaction: EntityManager;
                    result: T;
                };

                type Result = void;
            }

            namespace BuildAuditLogArchiveOutbox {
                type Props = SystemEntities.AuditLog;

                type Result = SystemEntities.Outbox;
            }
        }
    }
}
