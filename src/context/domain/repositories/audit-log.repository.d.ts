declare namespace Repositories {
    namespace AuditLog {
        interface Contract extends PublicContract {}

        interface PublicContract extends Repositories.Base.Contract<SystemEntities.AuditLog, Adapters.AuditLog.Types> {}

        interface QueryContract extends Pick<PublicContract, "findUniqueOrThrow" | "findMany"> {}
    }
}
