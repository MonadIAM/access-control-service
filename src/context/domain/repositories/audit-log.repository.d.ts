import { AuditLog as AuditLogEntity } from "~common/tracking";

declare global {
    namespace Repositories {
        namespace AuditLog {
            type Entity = AuditLogEntity;

            interface Contract extends Repositories.Base.Contract<Entity, Adapters.AuditLog.Types> {}
        }
    }
}
