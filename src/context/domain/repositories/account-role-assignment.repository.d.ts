declare namespace Repositories {
    namespace AccountRoleAssignment {
        interface Contract extends PublicContract {}

        interface PublicContract extends Repositories.Base.Contract<
            Entities.AccountRoleAssignment,
            Adapters.AccountRoleAssignment.Types
        > {
            wouldExceedRoleLimit: WouldExceedRoleLimit.Signature;
        }

        interface QueryContract extends Pick<PublicContract, "findUniqueOrThrow" | "findMany"> {}

        namespace WouldExceedRoleLimit {
            type Props = {
                transaction?: ORM.EntityManager;
                account: string;
                roles: string[];
            };

            type Result = Promise<boolean>;

            type Signature = (props: Props) => Result;
        }
    }
}
