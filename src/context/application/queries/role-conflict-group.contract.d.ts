import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries.RoleConflictGroup {
        interface Contract extends ControllerContract {}

        interface ControllerContract {
            findGroupsViolatedByAccount: FindGroupsViolatedByAccount.Signature;
            findAccountsViolatingRule: FindAccountsViolatingRule.Signature;
            findUnique: FindUnique.Signature;
            findMany: FindMany.Signature;
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

        namespace FindAccountsViolatingRule {
            type Props = {
                roles: string[];
                maxAllowed: number;
                realm: string;
            };

            type Result = Promise<Repositories.RoleConflictGroup.AccountViolationRow[]>;

            type Signature = (props: Props) => Result;
        }

        namespace FindUnique {
            type Props = {
                view: ResponseViewType;
                group: string;
                realm: string;
            };

            type Result = Promise<Entities.RoleConflictGroup>;

            type Signature = (props: Props) => Result;
        }

        namespace FindMany {
            type Props = {
                filters: Repositories.Mappers.RoleConflictGroup.Filters;
                sort: Repositories.Mappers.RoleConflictGroup.Sort;
                view: ResponseViewType;
                pagination: Pagination;
                realm: string;
            };

            type Result = Promise<[Entities.RoleConflictGroup[], number]>;

            type Signature = (props: Props) => Result;
        }
    }
}
