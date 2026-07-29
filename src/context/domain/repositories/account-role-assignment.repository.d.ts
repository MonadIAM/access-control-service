declare namespace Repositories {
    namespace AccountRoleAssignment {
        interface Contract extends Repositories.Base.Contract<
            Entities.AccountRoleAssignment,
            Adapters.AccountRoleAssignment.Types
        > {
            wouldExceedRoleLimit(props: WouldExceedRoleLimit.Props): WouldExceedRoleLimit.Result;
        }

        interface QueryContract extends Pick<Contract, "findUniqueOrThrow" | "findMany"> {}

        namespace WouldExceedRoleLimit {
            type Props = {
                transaction?: ORM.EntityManager;
                account: string;
                roles: string[];
            };

            type Result = Promise<boolean>;
        }
    }
}
