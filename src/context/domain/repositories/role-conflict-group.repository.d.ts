declare namespace Repositories {
    namespace RoleConflictGroup {
        interface PrivateContract {
            getViolationsQuery(props: GetViolationsQuery.Props): GetViolationsQuery.Result;
        }
        interface Contract
            extends PrivateContract,
                Repositories.Base.Contract<Entities.RoleConflictGroup, Adapters.Realm.Types> {
            wouldExceedGroupLimit(props: WouldExceedGroupLimit.Props): WouldExceedGroupLimit.Result;
            findViolationDetails(props: FindViolationDetails.Props): FindViolationDetails.Result;
            hasAccountViolating(props: HasAccountViolating.Props): HasAccountViolating.Result;
            hasViolations(props: HasViolations.Props): HasViolations.Result;
        }

        interface QueryContract extends Pick<Contract, "findViolationDetails" | "findUniqueOrThrow" | "findMany"> {}

        namespace FindViolationDetails {
            type Props = {
                account: string;
                roles: string[];
                realm: string;
            };

            type Result = Promise<Entities.RoleConflictGroup[]>;
        }

        namespace WouldExceedGroupLimit {
            type Props = {
                transaction?: ORM.EntityManager;
                count?: number;
                realm: string;
            };

            type Result = Promise<boolean>;
        }

        namespace HasAccountViolating {
            type Props = {
                transaction?: ORM.EntityManager;
                identifiers: string[];
                maxAllowed: number;
            };

            type Result = Promise<boolean>;
        }

        namespace HasViolations {
            type Props = {
                transaction?: ORM.EntityManager;
                account: string;
                roles: string[];
                realm: string;
            };

            type Result = Promise<boolean>;
        }

        namespace GetViolationsQuery {
            type Props = {
                transaction?: ORM.EntityManager;
                account: string;
                roles: string[];
                realm: string;
            };

            type Result = ORM.QueryBuilder;
        }
    }
}
