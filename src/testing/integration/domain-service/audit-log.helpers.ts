import { AuditLogRepository } from "~context/infrastructure/repositories/audit-log.repository";
import { AuditLogService } from "~context/domain/services/audit-log.service";

export class AuditLogIntegrationHelpers implements Integration.Domain.AuditLog.Contract {
    public service(context: Integration.Postgres.Suite.FactoryContext): Integration.Domain.AuditLog.Service.Context {
        const repositories = this.repositories(context);

        return {
            auditLogService: new AuditLogService(repositories.auditLogs),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
    ): Integration.Domain.AuditLog.Repositories.Context {
        return {
            auditLogs: new AuditLogRepository(context.readManager),
        };
    }
}
