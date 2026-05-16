declare namespace Repositories {
    namespace ChangeLog {
        interface Contract extends Repositories.Base.Contract<Entities.ChangeLog, Adapters.ChangeLog.Types> {}
        interface QueryContract extends Pick<Contract, "findUniqueOrThrow" | "findMany"> {}
    }
}
