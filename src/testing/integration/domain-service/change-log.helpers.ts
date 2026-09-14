import { ChangeLogRepository } from "~context/infrastructure/repositories/change-log.repository";
import { ChangeLogService } from "~context/domain/services/change-log.service";

export class ChangeLogIntegrationHelpers implements Integration.Domain.ChangeLog.Contract {
    public service(context: Integration.Postgres.Suite.FactoryContext): Integration.Domain.ChangeLog.Service.Context {
        const repositories = this.repositories(context);

        return {
            changeLogService: new ChangeLogService(repositories.changeLogs),
            repositories,
        };
    }

    public repositories(
        context: Integration.Postgres.Suite.FactoryContext,
    ): Integration.Domain.ChangeLog.Repositories.Context {
        return {
            changeLogs: new ChangeLogRepository(context.readManager),
        };
    }
}
