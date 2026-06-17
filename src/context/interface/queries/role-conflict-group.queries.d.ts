import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace RoleConflictGroup {
            interface Contract {
                findViolationDetails(props: FindViolationDetails.Props): FindViolationDetails.Result;
                findUnique(props: FindUnique.Props): FindUnique.Result;
                findMany(props: FindMany.Props): FindMany.Result;
            }

            namespace FindMany {
                type Props = {
                    filters: Adapters.RoleConflictGroup.Filters;
                    sort: Adapters.RoleConflictGroup.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                };

                type Result = Promise<[Entities.RoleConflictGroup[], number]>;
            }

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    group: string;
                    realm: string;
                };

                type Result = Promise<Entities.RoleConflictGroup>;
            }

            namespace FindViolationDetails {
                type Props = {
                    account: string;
                    roles: string[];
                    realm: string;
                };

                type Result = Promise<Entities.RoleConflictGroup[]>;
            }
        }
    }
}
