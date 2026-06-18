import { Inject, Injectable, Scope } from "@nestjs/common";

import { AUDIT_LOG_REPOSITORY } from "~context/infrastructure/repositories";
import { QueryMode } from "~context/enums";

@Injectable({ scope: Scope.DEFAULT })
export class AuditLogQueries implements Queries.AuditLog.Contract {
    public constructor(
        @Inject(AUDIT_LOG_REPOSITORY)
        private readonly auditLogRepository: Repositories.AuditLog.QueryContract,
    ) {}

    public findUnique(props: Queries.AuditLog.FindUnique.Props): Queries.AuditLog.FindUnique.Result {
        const where = props.mode === QueryMode.DEFAULT ? { id: props.log, realm: props.realm } : { id: props.log };

        return this.auditLogRepository.findUniqueOrThrow({ where });
    }

    public findMany(props: Queries.AuditLog.FindMany.Props): Queries.AuditLog.FindMany.Result {
        const prefilter = props.mode === QueryMode.DEFAULT ? { realm: props.realm } : {};

        return this.auditLogRepository.findMany({
            pagination: props.pagination,
            filters: props.filters,
            sort: props.sort,
            prefilter,
        });
    }
}
