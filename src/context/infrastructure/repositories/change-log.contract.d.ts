declare namespace Repositories.ChangeLog {
    interface Contract extends PublicContract {}

    interface PublicContract extends Repositories.Base.Contract<
        SystemEntities.ChangeLog,
        Repositories.Mappers.ChangeLog.Types
    > {}

    interface QueryContract extends Pick<PublicContract, "findUniqueOrThrow" | "findMany"> {}
}
