import { Inject, Injectable, Scope } from "@nestjs/common";

import { PERMISSION_REPOSITORY } from "~context/infrastructure/repositories";
import { QueryMode } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionQueries implements Queries.Permission.Contract {
    private readonly populate = {
        DETAILED: ["realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.QueryContract,
    ) {}

    public findUnique(props: Queries.Permission.FindUnique.Props): Queries.Permission.FindUnique.Result {
        return this.permissionRepository.findUniqueOrThrow({
            where: { id: props.permission, realm: props.realm },
            options: { populate: this.populate[props.view] },
        });
    }

    public findMany(props: Queries.Permission.FindMany.Props): Queries.Permission.FindMany.Result {
        const isManage = props.mode === QueryMode.MANAGE;
        const prefilter = isManage ? undefined : { realm: props.realm };

        return this.permissionRepository.findMany({
            options: { populate: this.populate[props.view] },
            pagination: props.pagination,
            filters: props.filters,
            sort: props.sort,
            prefilter,
        });
    }

    public getLookupList(props: Queries.Permission.GetLookupList.Props): Queries.Permission.GetLookupList.Result {
        const isManage = props.mode === QueryMode.MANAGE;
        const realm = isManage ? undefined : props.realm;

        return this.permissionRepository.getLookupList({
            pagination: props.pagination,
            term: props.term,
            realm,
        });
    }

    public findEffective(props: Queries.Permission.FindEffective.Props): Queries.Permission.FindEffective.Result {
        const isManage = props.mode === QueryMode.MANAGE;
        const account = isManage ? props.account : props.actor;

        return this.permissionRepository.findEffective({
            where: { realm: props.realm, account },
            pagination: props.pagination,
            filters: props.filters,
            sort: props.sort,
        });
    }
}
