import { Inject, Injectable, Scope } from "@nestjs/common";

import { CHANGE_LOG_REPOSITORY } from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class ChangeLogQueries implements Queries.ChangeLog.Contract {
    public constructor(
        @Inject(CHANGE_LOG_REPOSITORY)
        private readonly changeLogRepository: Repositories.ChangeLog.QueryContract,
    ) {}

    public findUnique(props: Queries.ChangeLog.FindUnique.Props): Queries.ChangeLog.FindUnique.Result {
        return this.changeLogRepository.findUniqueOrThrow({
            where: { id: props.log },
        });
    }

    public findMany(props: Queries.ChangeLog.FindMany.Props): Queries.ChangeLog.FindMany.Result {
        return this.changeLogRepository.findMany({
            pagination: props.pagination,
            filters: props.filters,
            sort: props.sort,
        });
    }
}
