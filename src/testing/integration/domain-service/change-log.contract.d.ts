declare namespace Integration.Domain.ChangeLog {
    type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

    interface Contract {
        repositories: Repositories.Signature;
        service: Service.Signature;
    }

    namespace Service {
        type Context = {
            changeLogService: Services.ChangeLog.Contract;
            repositories: Repositories.Context;
        };

        type Signature = (context: Postgres.Suite.FactoryContext) => Context;
    }

    namespace Repositories {
        type Context = {
            changeLogs: globalThis.Repositories.ChangeLog.Contract;
        };

        type Signature = (context: Postgres.Suite.FactoryContext) => Context;
    }
}
