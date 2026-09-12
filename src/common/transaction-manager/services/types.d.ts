import { KafkaTopic } from "~context/enums";

declare global {
    namespace TransactionManager {
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
            interface Contract extends PublicContract, InternalContract {}

            interface InternalContract {
                persistOutboxEvents: PersistOutboxEvents.Signature;
                executeWithEffects: ExecuteWithEffects.Signature;
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
                emit(props: Emit.Props): Emit.Result;
            }

            namespace Run {
                type ResultProps<T extends ORM.AnyEntity | ORM.AnyEntity[]> = {
                    execute(transaction: ORM.EntityManager): Thenable<T>;
                    outbox?: OutboxConfig<T> | OutboxConfig<T>[];
                    audit?: SystemEntities.AuditLog.ConstructorProps;
                    changeLog?: boolean;
                    resource?: string;
                };

                type VoidProps = {
                    execute(transaction: ORM.EntityManager): Thenable<void>;
                    audit?: SystemEntities.AuditLog.ConstructorProps;
                    changeLog?: boolean;
                    resource?: string;
                    outbox?: never;
                };

                type Props<T extends ORM.AnyEntity | ORM.AnyEntity[]> = ResultProps<T> | VoidProps;

                type Result<T> = Promise<T | void>;
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
