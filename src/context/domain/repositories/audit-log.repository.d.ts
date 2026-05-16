declare namespace Repositories {
    namespace AuditLog {
        interface Contract extends Repositories.Base.Contract<Entities.AuditLog, Adapters.AuditLog.Types> {}
        interface QueryContract extends Pick<Contract, "findUniqueOrThrow" | "findMany"> {}
    }
}
