import { Inject, Injectable, Scope } from "@nestjs/common";

import { PERMISSION_OVERRIDE_REPOSITORY } from "~context/infrastructure/repositories";
import { PublicLinkOperator } from "~infrastructure/database";
import { QueryMode } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionOverrideQueries implements Queries.PermissionOverride.Contract {
    private readonly populate = {
        DETAILED: ["permission", "realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(PERMISSION_OVERRIDE_REPOSITORY)
        private readonly permissionOverrideRepository: Repositories.PermissionOverride.QueryContract,
    ) {}

    public findUnique(props: Queries.PermissionOverride.FindUnique.Props): Queries.PermissionOverride.FindUnique.Result {
        const where = {
            account: props.mode === QueryMode.DEFAULT ? props.actor : props.account,
            realm: props.realm,
            id: props.override,
        };

        return this.permissionOverrideRepository.findUniqueOrThrow({
            options: { populate: this.populate[props.view] },
            where,
        });
    }

    public findMany(props: Queries.PermissionOverride.FindMany.Props): Queries.PermissionOverride.FindMany.Result {
        const filters = { ...props.filters };
        const prefilter = props.mode === QueryMode.DEFAULT ? { realm: props.realm } : {};

        if (props.mode === QueryMode.DEFAULT) {
            filters.account = { operator: PublicLinkOperator.EQUAL, value: props.actor };
        }

        return this.permissionOverrideRepository.findMany({
            options: { populate: this.populate[props.view] },
            pagination: props.pagination,
            sort: props.sort,
            prefilter,
            filters,
        });
    }
}
