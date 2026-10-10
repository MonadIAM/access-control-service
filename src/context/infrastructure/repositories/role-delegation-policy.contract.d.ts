declare namespace Repositories.RoleDelegationPolicy {
    type ExistsRow = {
        existsFlag: number;
    };

    type AllowedRow = {
        result: boolean;
    };

    interface Contract extends PublicContract {}

    interface PublicContract extends Repositories.Base.Contract<
        Entities.RoleDelegationPolicy,
        Repositories.Mappers.RoleDelegationPolicy.Types
    > {
        wouldExceedPolicyLimit: WouldExceedPolicyLimit.Signature;
        existsTransitivePath: ExistsTransitivePath.Signature;
        isDelegationAllowed: IsDelegationAllowed.Signature;
    }

    interface QueryContract extends Pick<PublicContract, "findUniqueOrThrow" | "findMany"> {}

    namespace WouldExceedPolicyLimit {
        type Props = {
            transaction?: ORM.EntityManager;
            delegator: string;
            count?: number;
        };

        type Result = Promise<boolean>;

        type Signature = (props: Props) => Result;
    }

    namespace ExistsTransitivePath {
        type Props = {
            transaction?: ORM.EntityManager;
            to: string | string[];
            from: string;
        };

        type Result = Promise<boolean>;

        type Signature = (props: Props) => Result;
    }

    namespace IsDelegationAllowed {
        type Props = {
            transaction?: ORM.EntityManager;
            roles: string[];
            realm: string;
            actor: string;
        };

        type Result = Promise<boolean>;

        type Signature = (props: Props) => Result;
    }
}
