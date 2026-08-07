declare namespace Repositories {
    namespace RoleConflictGroup {
        type Row = ORM.Raw<Entities.RoleConflictGroup> & {
            matchedCount: number;
            realm_id: string;
        };

        type ExistsRow = {
            exists: number;
        };

        type AccountRow = {
            account: string;
        };

        interface Contract extends PublicContract, InternalContract {}

        interface InternalContract {
            getViolationsQuery: GetViolationsQuery.Signature;
        }

        namespace GetViolationsQuery {
            type Props = {
                transaction?: ORM.EntityManager;
                account: string;
                roles: string[];
                realm: string;
            };

            type Result = ORM.QueryBuilder;

            type Signature = (props: Props) => Result;
        }

        interface PublicContract extends Repositories.Base.Contract<
            Entities.RoleConflictGroup,
            Repositories.Mappers.Realm.Types
        > {
            wouldExceedGroupLimit: WouldExceedGroupLimit.Signature;
            findViolationDetails: FindViolationDetails.Signature;
            hasAccountViolating: HasAccountViolating.Signature;
            hasViolations: HasViolations.Signature;
        }

        interface QueryContract extends Pick<PublicContract, "findViolationDetails" | "findUniqueOrThrow" | "findMany"> {}

        namespace WouldExceedGroupLimit {
            type Props = {
                transaction?: ORM.EntityManager;
                count?: number;
                realm: string;
            };

            type Result = Promise<boolean>;

            type Signature = (props: Props) => Result;
        }

        namespace FindViolationDetails {
            type Props = {
                account: string;
                roles: string[];
                realm: string;
            };

            type Result = Promise<Entities.RoleConflictGroup[]>;

            type Signature = (props: Props) => Result;
        }

        namespace HasAccountViolating {
            type Props = {
                transaction?: ORM.EntityManager;
                identifiers: string[];
                maxAllowed: number;
            };

            type Result = Promise<boolean>;

            type Signature = (props: Props) => Result;
        }

        namespace HasViolations {
            type Props = {
                transaction?: ORM.EntityManager;
                account: string;
                roles: string[];
                realm: string;
            };

            type Result = Promise<boolean>;

            type Signature = (props: Props) => Result;
        }
    }
}
