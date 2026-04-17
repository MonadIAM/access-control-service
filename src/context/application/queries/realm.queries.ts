import { Inject, Injectable, Scope } from "@nestjs/common";

import { PERMISSION_CACHE_SERVICE } from "~context/infrastructure/services";
import { REALM_REPOSITORY } from "~context/infrastructure/repositories";
import { PublicStringOperator } from "~infrastructure/database";
import { CommandException } from "~common/exceptions";
import { PermissionCode } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class RealmQueries implements Queries.Realm.Contract {
    private readonly dictionaryPath = "queries.realm";

    private readonly populate = {
        DETAILED: [] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(PERMISSION_CACHE_SERVICE)
        private readonly permissionCacheService: Services.PermissionCache.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.ExternalContract,
    ) {}

    public async findUnique(props: Queries.Realm.FindUnique.Props): Promise<Queries.Realm.FindUnique.Result> {
        if (!props.permissions?.includes(PermissionCode.REALM_READ_ABSOLUTE)) {
            const hasRealmRelation = await this.permissionCacheService.hasRealm({
                account: props.account,
                realm: props.realm,
            });
            if (!hasRealmRelation) {
                throw CommandException.notFound(`${this.dictionaryPath}.`);
            }
        }
        return this.realmRepository.findUniqueOrThrow({
            options: { populate: this.populate[props.view] },
            where: { id: props.realm },
        });
    }

    public async findMany(props: Queries.Realm.FindMany.Props): Promise<Queries.Realm.FindMany.Result> {
        const filters = { ...props.filters };
        if (!props.permissions?.includes(PermissionCode.REALM_READ_ABSOLUTE)) {
            const realms = await this.permissionCacheService.getRealms({ account: props.account });
            if (realms.length) {
                filters.id = { operator: PublicStringOperator.IN, value: realms };
            } else {
                return [[], 0];
            }
        }
        return this.realmRepository.findMany({
            options: { populate: this.populate[props.view] },
            pagination: props.pagination,
            sort: props.sort,
            filters,
        });
    }

    public async getLookupList(props: Queries.Realm.GetLookupList.Props): Promise<Queries.Realm.GetLookupList.Result> {
        let realms: string[] = [];
        if (!props.permissions?.includes(PermissionCode.REALM_READ_ABSOLUTE)) {
            realms = await this.permissionCacheService.getRealms({ account: props.account });

            if (!realms.length) {
                return [[], 0];
            }
        }
        return this.realmRepository.getLookupList({
            pagination: props.pagination,
            term: props.term,
            realms,
        });
    }
}
