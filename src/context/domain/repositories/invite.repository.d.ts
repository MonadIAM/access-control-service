declare namespace Repositories {
    namespace Invite {
        interface Contract extends PublicContract {}

        interface PublicContract extends Repositories.Base.Contract<Entities.Invite, Repositories.Mappers.Invite.Types> {}

        interface QueryContract extends Pick<PublicContract, "findUniqueOrThrow" | "findMany"> {}
    }
}
