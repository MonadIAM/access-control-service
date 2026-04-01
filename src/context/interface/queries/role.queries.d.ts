import { FindOptions } from "@mikro-orm/postgresql";

import { ResponseViewType } from "~context/enums";

declare global {
    namespace Queries {
        namespace Role {
            type Entity = Repositories.Role.Entity;
            type DepthEntity = Entity & { depth: number };
            type Graph = Repositories.Role.Graph.Data;

            interface Contract {
                findDelegableByAccount: (props: FindDelegableByAccount) => Promise<[Entity[], number]>;
                findDelegableByRole: (props: FindDelegableByRole) => Promise<[Entity[], number]>;
                findDescendants: (props: FindDescendants) => Promise<[DepthEntity[], number]>;
                findAncestors: (props: FindAncestors) => Promise<[DepthEntity[], number]>;
                findEffective: (props: FindEffective) => Promise<[Entity[], number]>;
                getLookupList: (props: GetLookupList) => Promise<[Entity[], number]>;
                getHierarchyGraph: (props: GetHierarchyGraph) => Promise<Graph>;
                findMany: (props: FindMany) => Promise<[Entity[], number]>;
                findUnique: (props: FindUnique) => Promise<Entity>;
            }

            type FindDelegableByAccount = {
                permissions?: string[];
                filters: Repositories.Role.Filters;
                sort: Repositories.Role.Sort;
                pagination: Pagination;
                realm: string;
                actor: string;
                id?: string;
            };

            type FindDelegableByRole = {
                filters: Repositories.Role.Filters;
                sort: Repositories.Role.Sort;
                pagination: Pagination;
                realm: string;
                id: string;
            };

            type FindDescendants = {
                filters: Repositories.Role.Filters;
                view: ResponseViewType;
                pagination: Pagination;
                ancestor: string;
                realm: string;
            };

            type FindAncestors = {
                filters: Repositories.Role.Filters;
                view: ResponseViewType;
                pagination: Pagination;
                descendant: string;
                realm: string;
            };

            type FindEffective = {
                permissions?: string[];
                filters: Repositories.Role.Filters;
                sort: Repositories.Role.Sort;
                pagination: Pagination;
                account?: string;
                realm: string;
                actor: string;
            };

            type GetLookupList = {
                options?: FindOptions<Entity>;
                pagination: Pagination;
                realm: string;
                term: string;
            };

            type GetHierarchyGraph = {
                realm: string;
            };

            type FindMany = {
                filters: Repositories.Role.Filters;
                sort: Repositories.Role.Sort;
                view: ResponseViewType;
                pagination: Pagination;
                realm: string;
            };

            type FindUnique = {
                view: ResponseViewType;
                realm: string;
                role: string;
            };
        }
    }
}
