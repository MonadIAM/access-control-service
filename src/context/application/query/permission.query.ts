import { Inject, Injectable, Scope } from "@nestjs/common";

import { PERMISSION_REPOSITORY } from "~context/infrastructure/repositories";
import { PermissionCode } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionQuery implements Queries.Permission.Contract {
    private readonly populate = {
        DETAILED: ["realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.Contract,
    ) {}

    public findUnique(props: Queries.Permission.FindUnique): Promise<Queries.Permission.Entity> {
        return this.permissionRepository.findUniqueOrThrow({
            where: { id: props.permission, realm: props.realm },
            options: { populate: this.populate[props.view] },
        });
    }

    public findMany(props: Queries.Permission.FindMany): Promise<[Queries.Permission.Entity[], number]> {
        return this.permissionRepository.findMany({
            options: { populate: this.populate[props.view] },
            pagination: props.pagination,
            filters: props.filters,
            realm: props.realm,
            sort: props.sort,
        });
    }

    public getLookupList(props: Queries.Permission.GetLookupList): Promise<[Queries.Permission.Entity[], number]> {
        return this.permissionRepository.getLookupList({
            pagination: props.pagination,
            realm: props.realm,
            term: props.term,
        });
    }

    public findEffective(props: Queries.Permission.FindEffective): Promise<[Queries.Permission.Entity[], number]> {
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
