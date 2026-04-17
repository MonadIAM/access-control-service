import { Inject, Injectable, Scope } from "@nestjs/common";

import { PERMISSION_OVERRIDE_REPOSITORY } from "~context/infrastructure/repositories";
import { PublicLinkOperator } from "~infrastructure/database";
import { PermissionCode } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionOverrideQueries implements Queries.PermissionOverride.Contract {
    private readonly populate = {
        DETAILED: ["permission", "realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(PERMISSION_OVERRIDE_REPOSITORY)
        private readonly permissionOverrideRepository: Repositories.PermissionOverride.ExternalContract,
    ) {}

    public findUnique(
        props: Queries.PermissionOverride.FindUnique.Props,
    ): Promise<Queries.PermissionOverride.FindUnique.Result> {
        let account = props.actor;
        if (props.permissions?.includes(PermissionCode.PERMISSION_OVERRIDE_READ_ABSOLUTE)) {
            account = props.account ?? props.actor;
        }
        return this.permissionOverrideRepository.findUniqueOrThrow({
            where: { id: props.override, account, realm: props.realm },
            options: { populate: this.populate[props.view] },
        });
    }

    public findMany(props: Queries.PermissionOverride.FindMany.Props): Promise<Queries.PermissionOverride.FindMany.Result> {
        const filters = { ...props.filters };
        if (!props.permissions?.includes(PermissionCode.PERMISSION_OVERRIDE_READ_ABSOLUTE)) {
            filters.account = { operator: PublicLinkOperator.EQUAL, value: props.actor };
        }
        return this.permissionOverrideRepository.findMany({
            options: { populate: this.populate[props.view] },
            prefilter: { realm: props.realm },
            pagination: props.pagination,
            sort: props.sort,
            filters,
        });
    }
}
