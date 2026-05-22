import { Inject, Injectable, Scope } from "@nestjs/common";

import { PROJECTION_CACHE_SERVICE } from "~context/infrastructure/services/tokens";
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
        @Inject(PROJECTION_CACHE_SERVICE)
        private readonly projectionCacheService: InfrastructureServices.ProjectionCache.Contract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.QueryContract,
    ) {}

    public async findUnique(props: Queries.Realm.FindUnique.Props): Queries.Realm.FindUnique.Result {
        if (!props.permissions?.includes(PermissionCode.REALM_READ_ABSOLUTE)) {
            const hasRealmRelation = await this.projectionCacheService.checkRealm({
                account: props.account,
                realm: props.realm,
            });
            if (!hasRealmRelation) {
                throw CommandException.notFound(`${this.dictionaryPath}.RELATION_NOT_FOUND`);
            }
        }
        return this.realmRepository.findUniqueOrThrow({
            options: { populate: this.populate[props.view] },
            where: { id: props.realm },
        });
    }

    public async findMany(props: Queries.Realm.FindMany.Props): Queries.Realm.FindMany.Result {
        const filters = { ...props.filters };
        if (!props.permissions?.includes(PermissionCode.REALM_READ_ABSOLUTE)) {
            const realms = await this.projectionCacheService.collectRealms({ account: props.account });
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

    public async getLookupList(props: Queries.Realm.GetLookupList.Props): Queries.Realm.GetLookupList.Result {
        let realms: Optional<string[]>;
        if (!props.permissions?.includes(PermissionCode.REALM_READ_ABSOLUTE)) {
            realms = await this.projectionCacheService.collectRealms({ account: props.account });
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
