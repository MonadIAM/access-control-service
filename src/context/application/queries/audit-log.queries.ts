import { Inject, Injectable, Scope } from "@nestjs/common";

import { AUDIT_LOG_REPOSITORY } from "~context/infrastructure/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class AuditLogQueries implements Queries.AuditLog.Contract {
    public constructor(
        @Inject(AUDIT_LOG_REPOSITORY)
        private readonly auditLogRepository: Repositories.AuditLog.QueryContract,
    ) {}

    public findUnique(props: Queries.AuditLog.FindUnique.Props): Queries.AuditLog.FindUnique.Result {
        return this.auditLogRepository.findUniqueOrThrow({
            where: { id: props.log },
        });
    }

    public findMany(props: Queries.AuditLog.FindMany.Props): Queries.AuditLog.FindMany.Result {
        return this.auditLogRepository.findMany({
            pagination: props.pagination,
            filters: props.filters,
            sort: props.sort,
        });
    }
}
