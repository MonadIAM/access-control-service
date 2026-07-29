declare namespace Repositories {
    namespace RoleDelegationPolicy {
        type ExistsRow = {
            exists_flag: number;
        };

        type AllowedRow = {
            result: boolean;
        };

        interface Contract extends Repositories.Base.Contract<
            Entities.RoleDelegationPolicy,
            Adapters.RoleDelegationPolicy.Types
        > {
            wouldExceedPolicyLimit(props: WouldExceedPolicyLimit.Props): WouldExceedPolicyLimit.Result;
            existsTransitivePath(props: ExistsTransitivePath.Props): ExistsTransitivePath.Result;
            isDelegationAllowed(props: IsDelegationAllowed.Props): IsDelegationAllowed.Result;
        }

        interface QueryContract extends Pick<Contract, "findUniqueOrThrow" | "findMany"> {}

        namespace ExistsTransitivePath {
            type Props = {
                transaction?: ORM.EntityManager;
                to: string | string[];
                from: string;
            };

            type Result = Promise<boolean>;
        }

        namespace WouldExceedPolicyLimit {
            type Props = {
                transaction?: ORM.EntityManager;
                delegator: string;
                count?: number;
            };

            type Result = Promise<boolean>;
        }

        namespace IsDelegationAllowed {
            type Props = {
                transaction?: ORM.EntityManager;
                roles: string[];
                realm: string;
                actor: string;
            };

            type Result = Promise<boolean>;
        }
    }
}
