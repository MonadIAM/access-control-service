declare namespace Repositories.RolePermissionAssignment {
    interface Contract extends PublicContract {}

    interface PublicContract extends Repositories.Base.Contract<
        Entities.RolePermissionAssignment,
        Repositories.Mappers.RolePermissionAssignment.Types
    > {
        wouldExceedPermissionLimit: WouldExceedPermissionLimit.Signature;
    }

    interface QueryContract extends Pick<PublicContract, "findUniqueOrThrow" | "findMany"> {}

    namespace WouldExceedPermissionLimit {
        type Props = {
            transaction?: ORM.EntityManager;
            permissions: string[];
            role: string;
        };

        type Result = Promise<boolean>;

        type Signature = (props: Props) => Result;
    }
}
