import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace RoleConflictGroup {
            type Entity = Repositories.RoleConflictGroup.Entity;

            interface Contract {
                findViolationDetails: (props: FindViolationDetails.Props) => Promise<FindViolationDetails.Result>;
                findUnique: (props: FindUnique.Props) => Promise<FindUnique.Result>;
                findMany: (props: FindMany.Props) => Promise<FindMany.Result>;
            }

            namespace FindMany {
                type Props = {
                    filters: Adapters.RoleConflictGroup.Filters;
                    sort: Adapters.RoleConflictGroup.Sort;
                    view: ResponseViewType;
                    pagination: Pagination;
                    realm: string;
                };

                type Result = [Entity[], number];
            }

            namespace FindUnique {
                type Props = {
                    view: ResponseViewType;
                    group: string;
                    realm: string;
                };

                type Result = Entity;
            }

            namespace FindViolationDetails {
                type Props = {
                    account: string;
                    roles: string[];
                    realm: string;
                };

                type Result = Entity[];
            }
        }
    }
}
