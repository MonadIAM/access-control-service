import { ChangeSetType } from "@mikro-orm/postgresql";

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
                context: RequestContext;
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
    }
}
