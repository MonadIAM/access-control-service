import { KafkaTopic } from "~context/enums";

declare global {
    namespace TransactionManager {
        namespace Inbox {
            interface Contract extends TransactionalContract, ProcessorContract {}

            interface TransactionalContract {
                claim: Claim.Signature;
            }

            interface ProcessorContract {
                clean: Clean.Signature;
            }

            namespace Claim {
                type Props = {
                    transaction: ORM.EntityManager;
                    incoming: Service.IncomingMessage;
                };

                type Row = Pick<ORM.Raw<SystemEntities.Inbox>, "event">;

                type Result = Promise<boolean>;

                type Signature = (props: Props) => Result;
            }

            namespace Clean {
                type Props = {
                    transaction: ORM.EntityManager;
                    expirationDate: Date;
                    batchSize: number;
                };

                type Row = Pick<ORM.Raw<SystemEntities.Inbox>, "consumer_key" | "event">;

                type Result = Promise<number>;

                type Signature = (props: Props) => Result;
            }
        }

        namespace Outbox {
            interface Contract extends PublicContract {}

            interface PublicContract {
                buildChangeLogArchive: BuildChangeLogArchive.Signature;
                buildAuditLogArchive: BuildAuditLogArchive.Signature;
                build: Build.Signature;
            }

            namespace Build {
                type Props = SystemEntities.Outbox.ConstructorProps;

                type Result = SystemEntities.Outbox;

                type Signature = (props: Props) => Result;
            }

            namespace BuildAuditLogArchive {
                type Props = SystemEntities.AuditLog;

                type Result = SystemEntities.Outbox;

                type Signature = (props: Props) => Result;
            }

            namespace BuildChangeLogArchive {
                type Props = SystemEntities.ChangeLog;

                type Result = SystemEntities.Outbox;

                type Signature = (props: Props) => Result;
            }
        }

        namespace LogMasking {
            type FieldClassification = Record<DataClassification, string[]>;
            type DataClassification = "SECRET" | "PII";

            type AuditTarget = {
                path: (string | number)[];
                value: string;
            };

            type ChangeTarget = {
                kind: "old" | "new";
                field: string;
                value: string;
            };

            interface Contract extends PublicContract, InternalContract {}

            interface PublicContract {
                maskChangeLog: MaskChangeLog.Signature;
                maskAuditLog: MaskAuditLog.Signature;
                sign: Sign.Signature;
            }

            namespace MaskAuditLog {
                type Props = {
                    input: UnknownObject;
                };

                type Result = Promise<UnknownObject>;

                type Signature = (props: Props) => Result;
            }

            namespace MaskChangeLog {
                type Props = {
                    delta: ValueObjects.DeltaChanges;
                };

                type Result = Promise<ValueObjects.DeltaChanges>;

                type Signature = (props: Props) => Result;
            }

            namespace Sign {
                type Props = {
                    entity: SystemEntities.AuditLog | SystemEntities.ChangeLog;
                };

                type Result = Promise<{
                    keyVersion: number;
                    signature: string;
                }>;

                type Signature = (props: Props) => Result;
            }

            interface InternalContract {
                normalize: Normalize.Signature;
                unflatten: Unflatten.Signature;
                flatten: Flatten.Signature;
                mask: Mask.Signature;
            }

            namespace Normalize {
                type Props = string;

                type Result = string;

                type Signature = (props: Props) => Result;
            }

            namespace Unflatten {
                type Props = {
                    path: (string | number)[];
                    value: unknown;
                    node: unknown;
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }

            namespace Flatten {
                type Props = {
                    path?: (string | number)[];
                    targets: AuditTarget[];
                    sensitive?: boolean;
                    node: unknown;
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }

            namespace Mask {
                type Props = string;

                type Result = string;

                type Signature = (props: Props) => Result;
            }
        }

        namespace Service {
            type ResultValue = ORM.AnyEntity | ORM.AnyEntity[] | void;

            type IncomingMessage = {
                consumerKey: string;
                event: string;
                source?: {
                    partition: number;
                    offset: string;
                    topic: string;
                };
            };

            interface Contract extends PublicContract, InternalContract {}

            interface InternalContract {
                persistOutboxEvents: PersistOutboxEvents.Signature;
                executeWithEffects: ExecuteWithEffects.Signature;
                executeTransaction: ExecuteTransaction.Signature;
                emitTransaction: EmitTransaction.Signature;
            }

            namespace PersistOutboxEvents {
                type Props<T extends Service.ResultValue> = {
                    params: TransactionManager.Service.Run.Props<T>;
                    transaction: ORM.EntityManager;
                    result: T;
                };

                type Result = void;

                type Signature = <T extends Service.ResultValue>(props: Props<T>) => Result;
            }

            namespace ExecuteWithEffects {
                type Props<T extends Service.ResultValue> = {
                    params: TransactionManager.Service.Run.Props<T>;
                    transaction: ORM.EntityManager;
                };

                type Result<T extends Service.ResultValue> = Promise<T>;

                type Signature = <T extends Service.ResultValue>(props: Props<T>) => Result<T>;
            }

            namespace EmitTransaction {
                type Props = {
                    params: Emit.Props;
                    transaction: ORM.EntityManager;
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace ExecuteTransaction {
                type Props<T extends Service.ResultValue> = {
                    params: TransactionManager.Service.Run.Props<T>;
                    transaction: ORM.EntityManager;
                };

                type Result<T extends Service.ResultValue> = Promise<T>;

                type Signature = <T extends Service.ResultValue>(props: Props<T>) => Result<T>;
            }

            interface PublicContract {
                consume: Consume.Signature;
                emit: Emit.Signature;
                run: Run.Signature;
            }

            namespace Consume {
                type ExecuteProps<T extends Service.ResultValue> = Run.Props<T> & {
                    incoming: IncomingMessage;
                    payload?: never;
                    destinationTopic?: never;
                    actionType?: never;
                    metadata?: never;
                };

                type PayloadProps = Emit.Props & {
                    incoming: IncomingMessage;
                    execute?: never;
                    changeLog?: never;
                    outbox?: never;
                };

                type Props<T extends Service.ResultValue> = ExecuteProps<T> | PayloadProps;

                type Outcome<T> =
                    | {
                          status: "processed";
                          value: T;
                      }
                    | {
                          status: "duplicate";
                      };

                type Result<T> = Promise<Outcome<T>>;

                type Signature = {
                    <T extends Service.ResultValue>(props: ExecuteProps<T>): Result<T>;
                    (props: PayloadProps): Result<void>;
                };
            }

            namespace Run {
                type Props<T extends Service.ResultValue> = {
                    execute(transaction: ORM.EntityManager): Thenable<T>;
                    outbox?: OutboxConfig<T> | OutboxConfig<T>[];
                    audit?: SystemEntities.AuditLog.ConstructorProps;
                    changeLog?: boolean;
                    resource?: string;
                };

                type Result<T extends Service.ResultValue> = Promise<T>;

                type Signature = <T extends Service.ResultValue>(props: Props<T>) => Result<T>;
            }

            namespace Emit {
                type Props = {
                    [D in keyof OutboxPayloadMap]: {
                        audit: SystemEntities.AuditLog.ConstructorProps;
                        payload: OutboxPayloadMap[D];
                        metadata?: UnknownObject;
                        destinationTopic: D;
                        actionType: string;
                        resource?: string;
                    };
                }[keyof OutboxPayloadMap];

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            type OutboxPayloadMap = {
                [KafkaTopic.NOTIFICATION]: Topics.Notification.Message["payload"];
                [KafkaTopic.ACCESS_CACHE]: Topics.AccessCache.Message["payload"];
                [KafkaTopic.REALM]: Topics.Realm.Message["payload"];
                [KafkaTopic.PROJECTION_JOURNAL]: UnknownObject;
            };

            type OutboxConfig<T extends Service.ResultValue> = {
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
