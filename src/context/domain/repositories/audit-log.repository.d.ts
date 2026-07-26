declare namespace Repositories {
    namespace AuditLog {
        interface Contract extends Repositories.Base.Contract<SystemEntities.AuditLog, Adapters.AuditLog.Types> {}
        interface QueryContract extends Pick<Contract, "findUniqueOrThrow" | "findMany"> {}
    }
}
