declare namespace Repositories {
    namespace AuditLog {
        interface Contract extends PublicContract {}

        interface PublicContract extends Repositories.Base.Contract<
            SystemEntities.AuditLog,
            Repositories.Mappers.AuditLog.Types
        > {}

        interface QueryContract extends Pick<PublicContract, "findUniqueOrThrow" | "findMany"> {}
    }
}
