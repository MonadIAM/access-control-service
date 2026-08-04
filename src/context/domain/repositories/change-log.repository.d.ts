declare namespace Repositories {
    namespace ChangeLog {
        interface Contract extends PublicContract {}

        interface PublicContract extends Repositories.Base.Contract<SystemEntities.ChangeLog, Adapters.ChangeLog.Types> {}

        interface QueryContract extends Pick<PublicContract, "findUniqueOrThrow" | "findMany"> {}
    }
}
