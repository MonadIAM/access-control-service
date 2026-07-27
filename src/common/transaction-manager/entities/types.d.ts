import { KafkaTopic } from "~context/enums";

import { ChangeLog as ChangeLogEntity } from "./change-log.entity";
import { AuditLog as AuditLogEntity } from "./audit-log.entity";
import { Outbox as OutboxEntity } from "./outbox.entity";

declare global {
    type DeltaChanges = Record<string, { old: unknown; new: unknown }>;

    namespace SystemEntities {
        namespace AuditLog {
            type ConstructorProps = {
                actionType: string;
                entityType: string;
                actor: string;
                realm?: string;
                input?: UnknownObject;
                context: Extract.Meta;
            };
        }

        type AuditLog = AuditLogEntity;

        namespace ChangeLog {
            type ConstructorProps = {
                auditEntry: string;
                changeType: ORM.ChangeSetType;
                entityType: string;
                entity: string;
                delta: DeltaChanges;
            };
        }

        type ChangeLog = ChangeLogEntity;

        namespace Outbox {
            type ConstructorProps = {
                destinationTopic: KafkaTopic;
                metadata?: UnknownObject;
                actionType: string;
                payload: UnknownObject;
            };
        }

        type Outbox = OutboxEntity;
    }
}
