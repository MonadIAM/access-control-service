import { EntityManager } from "@mikro-orm/postgresql";

import { AssignmentScope } from "~context/enums";

import { Permission as PermissionEntity } from "../entities";

declare global {
    namespace Repositories {
        namespace Permission {
            type Entity = PermissionEntity;

            interface InternalContract extends Repositories.Base.Contract<Entity, Adapters.Permission.Types> {
                collectEffective: (props: CollectEffective.Props) => Promise<CollectEffective.Result>;
                wouldExceedPermissionLimit: (props: WouldExceedPermissionLimit) => Promise<boolean>;
                findAccountsByPermissions: (props: FindAccountsByPermissions) => Promise<string[]>;
                getLookupList: (props: GetLookupList) => Promise<[Entity[], number]>;
                findEffective: (props: FindEffective) => Promise<[Entity[], number]>;
            }

            interface ExternalContract
                extends Pick<InternalContract, "getLookupList" | "findEffective" | "findUniqueOrThrow" | "findMany"> {}

            type GetLookupList = {
                pagination: Pagination;
                realm: string;
                term: string;
            };

            type FindEffective = {
                filters: Adapters.Permission.Filters;
                sort: Adapters.Permission.Sort;
                pagination: Pagination;
                where: {
                    account: string;
                    realm: string;
                };
            };

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

            type FindAccountsByPermissions = {
                transaction?: EntityManager;
                permissions: string[];
            };

            type WouldExceedPermissionLimit = {
                transaction?: EntityManager;
                count?: number;
                realm: string;
            };
        }
    }
}
