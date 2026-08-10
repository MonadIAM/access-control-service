declare namespace Repositories {
    namespace RoleConflictGroup {
        type Row = ORM.Raw<Entities.RoleConflictGroup> & {
            matchedCount: number;
            realm_id: string;
        };

        type ExistsRow = {
            exists: number;
        };

        type AccountViolationRow = {
            account: string;
            matchedCount: number;
        };

        interface Contract extends PublicContract, InternalContract {}

        interface InternalContract {
            getGroupsViolatedByAccountQuery: GetGroupsViolatedByAccountQuery.Signature;
            getAccountsViolatingRuleQuery: GetAccountsViolatingRuleQuery.Signature;
        }

        namespace GetGroupsViolatedByAccountQuery {
            type Props = {
                transaction?: ORM.EntityManager;
                account: string;
                roles: string[];
                realm: string;
            };

            type Result = ORM.QueryBuilder;

            type Signature = (props: Props) => Result;
        }

        namespace GetAccountsViolatingRuleQuery {
            type Props = {
                identifiers: string[];
                maxAllowed: number;
                realm: string;
            };

            type Result = ORM.QueryBuilder;

            type Signature = (props: Props) => Result;
        }

        interface PublicContract extends Repositories.Base.Contract<
            Entities.RoleConflictGroup,
            Repositories.Mappers.Realm.Types
        > {
            hasGroupsWithViolatingAccounts: HasGroupsWithViolatingAccounts.Signature;
            findGroupsViolatedByAccount: FindGroupsViolatedByAccount.Signature;
            hasGroupsViolatedByAccount: HasGroupsViolatedByAccount.Signature;
            findAccountsViolatingRule: FindAccountsViolatingRule.Signature;
            hasAccountsViolatingRule: HasAccountsViolatingRule.Signature;
            wouldExceedGroupLimit: WouldExceedGroupLimit.Signature;
        }

        interface QueryContract extends Pick<
            PublicContract,
            "findGroupsViolatedByAccount" | "findAccountsViolatingRule" | "findUniqueOrThrow" | "findMany"
        > {}

        namespace HasGroupsWithViolatingAccounts {
            type Props = {
                transaction?: ORM.EntityManager;
                groups: string[];
                realm: string;
            };

            type Result = Promise<boolean>;

            type Signature = (props: Props) => Result;
        }

        namespace FindGroupsViolatedByAccount {
            type Props = {
                account: string;
                roles: string[];
                realm: string;
            };

            type Result = Promise<Entities.RoleConflictGroup[]>;

            type Signature = (props: Props) => Result;
        }

        namespace HasGroupsViolatedByAccount {
            type Props = {
                transaction?: ORM.EntityManager;
                account: string;
                roles: string[];
                realm: string;
            };

            type Result = Promise<boolean>;

            type Signature = (props: Props) => Result;
        }

        namespace FindAccountsViolatingRule {
            type Props = {
                transaction?: ORM.EntityManager;
                identifiers: string[];
                maxAllowed: number;
                realm: string;
            };

            type Result = Promise<AccountViolationRow[]>;

            type Signature = (props: Props) => Result;
        }

        namespace HasAccountsViolatingRule {
            type Props = {
                transaction?: ORM.EntityManager;
                identifiers: string[];
                maxAllowed: number;
                realm: string;
            };

            type Result = Promise<boolean>;

            type Signature = (props: Props) => Result;
        }

        namespace WouldExceedGroupLimit {
            type Props = {
                transaction?: ORM.EntityManager;
                count?: number;
                realm: string;
            };

            type Result = Promise<boolean>;

            type Signature = (props: Props) => Result;
        }
    }
}
