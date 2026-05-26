declare namespace Repositories {
    namespace Invite {
        interface Contract extends Repositories.Base.Contract<Entities.Invite, Adapters.Invite.Types> {}

        interface QueryContract extends Pick<Contract, "findUniqueOrThrow" | "findMany"> {}
    }
}
