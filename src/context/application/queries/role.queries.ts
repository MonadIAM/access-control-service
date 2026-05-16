import { Inject, Injectable, Scope } from "@nestjs/common";

import { ROLE_REPOSITORY } from "~context/infrastructure/repositories";
import { DelegatorType, PermissionCode } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class RoleQueries implements Queries.Role.Contract {
    private readonly populate = {
        DETAILED: ["realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(ROLE_REPOSITORY)
        private readonly roleRepository: Repositories.Role.QueryContract,
    ) {}

    public findUnique(props: Queries.Role.FindUnique.Props): Queries.Role.FindUnique.Result {
        return this.roleRepository.findUniqueOrThrow({
            options: { populate: this.populate[props.view] },
            where: { id: props.role, realm: props.realm },
        });
    }

    public findMany(props: Queries.Role.FindMany.Props): Queries.Role.FindMany.Result {
        return this.roleRepository.findMany({
            options: { populate: this.populate[props.view] },
            prefilter: { realm: props.realm },
            pagination: props.pagination,
            filters: props.filters,
            sort: props.sort,
        });
    }

    public findAncestors(props: Queries.Role.FindAncestors.Props): Queries.Role.FindAncestors.Result {
        return this.roleRepository.findAncestors({
            populate: this.populate[props.view],
            descendant: props.descendant,
            pagination: props.pagination,
            filters: props.filters,
            realm: props.realm,
        });
    }

    public findDescendants(props: Queries.Role.FindDescendants.Props): Queries.Role.FindDescendants.Result {
        return this.roleRepository.findDescendants({
            populate: this.populate[props.view],
            pagination: props.pagination,
            ancestor: props.ancestor,
            filters: props.filters,
            realm: props.realm,
        });
    }

    public findDelegableByAccount(
        props: Queries.Role.FindDelegableByAccount.Props,
    ): Queries.Role.FindDelegableByAccount.Result {
        let id = props.actor;
        if (props.permissions?.includes(PermissionCode.ROLE_READ_ABSOLUTE)) {
            id = props.id ?? props.actor;
        }
        return this.roleRepository.findDelegateable({
            where: { type: DelegatorType.ACCOUNT, realm: props.realm, id },
            pagination: props.pagination,
            filters: props.filters,
            sort: props.sort,
        });
    }

    public findDelegableByRole(props: Queries.Role.FindDelegableByRole.Props): Queries.Role.FindDelegableByRole.Result {
        return this.roleRepository.findDelegateable({
            where: {
                type: DelegatorType.ROLE,
                realm: props.realm,
                id: props.id,
            },
            pagination: props.pagination,
            filters: props.filters,
            sort: props.sort,
        });
    }

    public findEffective(props: Queries.Role.FindEffective.Props): Queries.Role.FindEffective.Result {
        let account = props.actor;
        if (props.permissions?.includes(PermissionCode.ROLE_READ_ABSOLUTE)) {
            account = props.account ?? props.actor;
        }
        return this.roleRepository.findEffective({
            where: { realm: props.realm, account },
            pagination: props.pagination,
            filters: props.filters,
            sort: props.sort,
        });
    }

    public getLookupList(props: Queries.Role.GetLookupList.Props): Queries.Role.GetLookupList.Result {
        return this.roleRepository.getLookupList({
            pagination: props.pagination,
            realm: props.realm,
            term: props.term,
        });
    }

    public getHierarchyGraph(props: Queries.Role.GetHierarchyGraph.Props): Queries.Role.GetHierarchyGraph.Result {
        return this.roleRepository.getHierarchyGraph({
            realm: props.realm,
        });
    }
}
