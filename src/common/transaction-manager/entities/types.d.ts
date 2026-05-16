import { ChangeSetType } from "@mikro-orm/postgresql";

import { AggregateType, EventType, KafkaTopic } from "~context/enums";

import { ProjectionJournal as ProjectionJournalEntity } from "./projection-journal.entity";
import { ChangeLog as ChangeLogEntity } from "./change-log.entity";
import { AuditLog as AuditLogEntity } from "./audit-log.entity";
import { Outbox as OutboxEntity } from "./outbox.entity";

declare global {
    type DeltaChanges = Record<string, { old: unknown; new: unknown }>;

    namespace Entities {
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
                changeType: ChangeSetType;
                entityType: string;
                entity: string;
                delta: DeltaChanges;
            };
        }

        type ChangeLog = ChangeLogEntity;

        namespace Outbox {
            type ConstructorProps = {
                destinationTopic: KafkaTopic;
                aggregateType: AggregateType;
                eventType: EventType;
                metadata?: UnknownObject;
                payload: UnknownObject;
            };
        }

        type Outbox = OutboxEntity;

        namespace ProjectionJournal {
            type ConstructorProps = {
                payload: UnknownObject;
                operationType: string;
                availableAt?: Date;
            };
        }

        type ProjectionJournal = ProjectionJournalEntity;
    }
}
