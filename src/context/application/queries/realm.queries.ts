import { Inject, Injectable, Scope } from "@nestjs/common";

import { PROJECTION_CACHE_SERVICE } from "~context/infrastructure/services";
import { REALM_REPOSITORY } from "~context/domain/repositories";
import { PublicStringOperator } from "~infrastructure/database";
import { Exception } from "~common/exceptions";
import { QueryMode } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class RealmQueries implements Queries.Realm.Contract {
    private readonly dictionaryPath = "queries.realm";

    private readonly populate = {
        DETAILED: [] as const,
        COMPACT: [] as const,
    };

    public constructor(
        @Inject(PROJECTION_CACHE_SERVICE)
        private readonly projectionCacheService: InfrastructureServices.ProjectionCache.PublicContract,
        @Inject(REALM_REPOSITORY)
        private readonly realmRepository: Repositories.Realm.QueryContract,
    ) {}

    public async findUnique(props: Queries.Realm.FindUnique.Props): Queries.Realm.FindUnique.Result {
        if (props.mode === QueryMode.DEFAULT) {
            const hasRealmRelation = await this.projectionCacheService.checkRealm({
                account: props.account,
                realm: props.realm,
            });
            if (!hasRealmRelation) {
                throw Exception.notFound({ messageKey: `${this.dictionaryPath}.RELATION_NOT_FOUND` });
            }
        }
        return this.realmRepository.findUniqueOrThrow({
            options: { populate: this.populate[props.view] },
            where: { id: props.realm },
        });
    }

    public async findMany(props: Queries.Realm.FindMany.Props): Queries.Realm.FindMany.Result {
        const filters = { ...props.filters };
        if (props.mode === QueryMode.DEFAULT) {
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
        if (props.mode === QueryMode.DEFAULT) {
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
