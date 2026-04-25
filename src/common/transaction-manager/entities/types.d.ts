import { ChangeSetType } from "@mikro-orm/postgresql";

import { AggregateType, EventType, OutboxTopic } from "~context/enums";

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

        namespace ChangeLog {
            type ConstructorProps = {
                auditEntry: string;
                changeType: ChangeSetType;
                entityType: string;
                entity: string;
                delta: DeltaChanges;
            };
        }

        namespace Outbox {
            type ConstructorProps = {
                destinationTopic: OutboxTopic;
                aggregateType: AggregateType;
                eventType: EventType;
                metadata?: UnknownObject;
                payload: UnknownObject;
            };
        }
    }
}
