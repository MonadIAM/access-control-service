import { Inject, Injectable, Scope } from "@nestjs/common";

import { PERMISSION_REPOSITORY } from "~context/infrastructure/repositories";
import { PROJECTION_CACHE_SERVICE } from "~context/infrastructure/services";
import { PrivilegeScope, QueryMode } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class PermissionQueries implements Queries.Permission.Contract {
    private readonly populate = {
        DETAILED: ["realm"] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(PROJECTION_CACHE_SERVICE)
        private readonly projectionCacheService: InfrastructureServices.ProjectionCache.PublicContract,
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.QueryContract,
    ) {}

    public async getPrivileges(props: Queries.Permission.GetPrivileges.Props): Queries.Permission.GetPrivileges.Result {
        const realms = [...new Set(props.realms)];
        if (realms.length) {
            const permissions = await this.projectionCacheService.collectPermissions({
                account: props.account,
                realms,
            });

            const result: Record<string, Queries.Permission.GetPrivileges.Access[]> = Object.create(null);

            for (const code in permissions.global) {
                result[code] = [{ scope: PrivilegeScope.GLOBAL }];
            }

            for (const realm of realms) {
                for (const code in permissions.realms[realm]) {
                    const access = result[code] ?? [];
                    const scoped = access[access.length - 1];
                    if (scoped?.scope === PrivilegeScope.REALM) {
                        scoped.realms.push(realm);
                    } else {
                        access.push({ scope: PrivilegeScope.REALM, realms: [realm] });
                        result[code] = access;
                    }
                }
            }

            return result;
        } else {
            return {};
        }
    }

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
