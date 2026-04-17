import { Inject, Injectable, Scope } from "@nestjs/common";

import { PERMISSION_REPOSITORY } from "~context/infrastructure/repositories";
import { PermissionCode } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionQueries implements Queries.Permission.Contract {
    private readonly populate = {
        DETAILED: ["realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.ExternalContract,
    ) {}

    public findUnique(props: Queries.Permission.FindUnique.Props): Promise<Queries.Permission.FindUnique.Result> {
        return this.permissionRepository.findUniqueOrThrow({
            where: { id: props.permission, realm: props.realm },
            options: { populate: this.populate[props.view] },
        });
    }

    public findMany(props: Queries.Permission.FindMany.Props): Promise<Queries.Permission.FindMany.Result> {
        return this.permissionRepository.findMany({
            options: { populate: this.populate[props.view] },
            prefilter: { realm: props.realm },
            pagination: props.pagination,
            filters: props.filters,
            sort: props.sort,
        });
    }

    public getLookupList(props: Queries.Permission.GetLookupList.Props): Promise<Queries.Permission.GetLookupList.Result> {
        return this.permissionRepository.getLookupList({
            pagination: props.pagination,
            realm: props.realm,
            term: props.term,
        });
    }

    public findEffective(props: Queries.Permission.FindEffective.Props): Promise<Queries.Permission.FindEffective.Result> {
        let account = props.actor;
        if (props.permissions?.includes(PermissionCode.PERMISSION_READ_ABSOLUTE)) {
            account = props.account ?? props.actor;
        }
        return this.permissionRepository.findEffective({
            where: { realm: props.realm, account },
            pagination: props.pagination,
            filters: props.filters,
            sort: props.sort,
        });
    }
}
