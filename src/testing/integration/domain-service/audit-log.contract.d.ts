declare namespace Integration.Domain.AuditLog {
    type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

    interface Contract {
        repositories: Repositories.Signature;
        service: Service.Signature;
    }

    namespace Service {
        type Context = {
            auditLogService: Services.AuditLog.Contract;
            repositories: Repositories.Context;
        };

        type Signature = (context: Postgres.Suite.FactoryContext) => Context;
    }

    namespace Repositories {
        type Context = {
            auditLogs: globalThis.Repositories.AuditLog.Contract;
        };

        type Signature = (context: Postgres.Suite.FactoryContext) => Context;
    }
}
