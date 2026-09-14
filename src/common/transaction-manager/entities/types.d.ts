import { KafkaTopic } from "~context/enums";

import { ChangeLog as ChangeLogEntity } from "./change-log.entity";
import { AuditLog as AuditLogEntity } from "./audit-log.entity";
import { Outbox as OutboxEntity } from "./outbox.entity";
import { Inbox as InboxEntity } from "./inbox.entity";

declare global {
    namespace SystemEntities {
        namespace AuditLog {
            type ConstructorProps = {
                actionType: string;
                entityType: string;
                actor?: string;
                realm?: string;
                input?: UnknownObject;
                context: Extract.Meta;
            };

            namespace Sign {
                type Props = {
                    keyVersion: number;
                    signature: string;
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }
        }

        type AuditLog = AuditLogEntity;

        namespace ChangeLog {
            type ConstructorProps = {
                auditEntry: string;
                changeType: ORM.ChangeSetType;
                entityType: string;
                entity: string;
                delta: ValueObjects.DeltaChanges;
            };

            namespace Sign {
                type Props = {
                    keyVersion: number;
                    signature: string;
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }
        }

        type ChangeLog = ChangeLogEntity;

        namespace Outbox {
            namespace Envelope {
                type Result = {
                    actionType: string;
                    payload: UnknownObject;
                };

                type Signature = () => Result;
            }

            type ConstructorProps = {
                destinationTopic: KafkaTopic;
                metadata?: UnknownObject;
                actionType: string;
                payload: UnknownObject;
            };
        }

        type Outbox = OutboxEntity;

        namespace Inbox {
            type ConstructorProps = {
                consumerKey: string;
                event: string;
                source?: {
                    partition: number;
                    offset: string;
                    topic: string;
                };
            };
        }

        type Inbox = InboxEntity;
    }
}
