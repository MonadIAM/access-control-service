import { AssignmentScope } from "~context/enums";

declare global {
    namespace Repositories.Permission {
        type Row = ORM.Raw<Entities.Permission> & {
            realm_id: string;
        };

        type CountRow = {
            total: string;
        };

        type AccountRow = {
            account: string;
        };

        interface Contract extends PublicContract {}

        interface PublicContract extends Repositories.Base.Contract<
            Entities.Permission,
            Repositories.Mappers.Permission.Types
        > {
            wouldExceedPermissionLimit: WouldExceedPermissionLimit.Signature;
            findAccountsByPermissions: FindAccountsByPermissions.Signature;
            collectEffective: CollectEffective.Signature;
            getLookupList: GetLookupList.Signature;
            findEffective: FindEffective.Signature;
        }

        interface QueryContract extends Pick<
            PublicContract,
            "getLookupList" | "findEffective" | "findUniqueOrThrow" | "findMany"
        > {}

        namespace WouldExceedPermissionLimit {
            type Props = {
                transaction?: ORM.EntityManager;
                count?: number;
                realm: string;
            };

            type Result = Promise<boolean>;

            type Signature = (props: Props) => Result;
        }

        namespace FindAccountsByPermissions {
            type Props = {
                transaction?: ORM.EntityManager;
                permissions: string[];
            };

            type Result = Promise<string[]>;

            type Signature = (props: Props) => Result;
        }

        namespace CollectEffective {
            type Props = {
                account: string;
            };

            type Result = Promise<
                {
                    scope: AssignmentScope;
                    permission: string;
                    realm: string;
                }[]
            >;

            type Signature = (props: Props) => Result;
        }

        namespace GetLookupList {
            type Props = {
                pagination: Pagination;
                realm?: string;
                term: string;
            };

            type Result = Promise<[Entities.Permission[], number]>;

            type Signature = (props: Props) => Result;
        }

        namespace FindEffective {
            type Props = {
                filters: Repositories.Mappers.Permission.Filters;
                sort: Repositories.Mappers.Permission.Sort;
                pagination: Pagination;
                where: {
                    account: string;
                    realm: string;
                };
            };

            type Result = Promise<[Entities.Permission[], number]>;

            type Signature = (props: Props) => Result;
        }
    }
}
