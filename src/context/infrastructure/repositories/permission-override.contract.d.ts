declare namespace Repositories.PermissionOverride {
    interface Contract extends PublicContract {}

    interface PublicContract extends Repositories.Base.Contract<
        Entities.PermissionOverride,
        Repositories.Mappers.PermissionOverride.Types
    > {
        wouldExceedOverrideLimit: WouldExceedOverrideLimit.Signature;
    }

    interface QueryContract extends Pick<PublicContract, "findUniqueOrThrow" | "findMany"> {}

    namespace WouldExceedOverrideLimit {
        type Props = {
            transaction?: ORM.EntityManager;
            account: string;
            count?: number;
            realm: string;
        };

        type Result = Promise<boolean>;

        type Signature = (props: Props) => Result;
    }
}
