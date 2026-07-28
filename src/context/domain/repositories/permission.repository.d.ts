import { AssignmentScope } from "~context/enums";

declare global {
    namespace Repositories {
        namespace Permission {
            type Row = ORM.Raw<Entities.Permission> & {
                realm_id: string;
            };

            type CountRow = {
                total: string;
            };

            type AccountRow = {
                account: string;
            };

            interface Contract extends Repositories.Base.Contract<Entities.Permission, Adapters.Permission.Types> {
                wouldExceedPermissionLimit(props: WouldExceedPermissionLimit.Props): WouldExceedPermissionLimit.Result;
                findAccountsByPermissions(props: FindAccountsByPermissions.Props): FindAccountsByPermissions.Result;
                collectEffective(props: CollectEffective.Props): Promise<CollectEffective.Result>;
                getLookupList(props: GetLookupList.Props): GetLookupList.Result;
                findEffective(props: FindEffective.Props): FindEffective.Result;
            }

            interface QueryContract
                extends Pick<Contract, "getLookupList" | "findEffective" | "findUniqueOrThrow" | "findMany"> {}

            namespace GetLookupList {
                type Props = {
                    pagination: Pagination;
                    realm?: string;
                    term: string;
                };

                type Result = Promise<[Entities.Permission[], number]>;
            }

            namespace FindEffective {
                type Props = {
                    filters: Adapters.Permission.Filters;
                    sort: Adapters.Permission.Sort;
                    pagination: Pagination;
                    where: {
                        account: string;
                        realm: string;
                    };
                };

                type Result = Promise<[Entities.Permission[], number]>;
            }

            namespace CollectEffective {
                type Props = {
                    account: string;
                };

                type Result = {
                    scope: AssignmentScope;
                    permission: string;
                    realm: string;
                }[];
            }

            namespace FindAccountsByPermissions {
                type Props = {
                    transaction?: ORM.EntityManager;
                    permissions: string[];
                };

                type Result = Promise<string[]>;
            }

            namespace WouldExceedPermissionLimit {
                type Props = {
                    transaction?: ORM.EntityManager;
                    count?: number;
                    realm: string;
                };

                type Result = Promise<boolean>;
            }
        }
    }
}
