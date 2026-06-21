import { Inject, Injectable, Scope } from "@nestjs/common";
import { FilterQuery } from "@mikro-orm/postgresql";

import { PERMISSION_OVERRIDE_REPOSITORY } from "~context/infrastructure/repositories";
import { PublicLinkOperator } from "~infrastructure/database";
import { PermissionOverride } from "~context/domain/entities";
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
        const where: FilterQuery<PermissionOverride> = { id: props.override, realm: props.realm };

        if (props.mode === QueryMode.DEFAULT) {
            where.account = props.actor;
        }

        return this.permissionOverrideRepository.findUniqueOrThrow({
            options: { populate: this.populate[props.view] },
            where,
        });
    }

    public findMany(props: Queries.PermissionOverride.FindMany.Props): Queries.PermissionOverride.FindMany.Result {
        const prefilter = { realm: props.realm };
        const filters = { ...props.filters };

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
