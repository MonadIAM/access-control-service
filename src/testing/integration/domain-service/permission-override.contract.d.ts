declare namespace Integration.Domain.PermissionOverride {
    type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

    interface Contract {
        seedSystemRealm: SeedSystemRealm.Signature;
        repositories: Repositories.Signature;
        service: Service.Signature;
    }

    namespace Service {
        type Context = {
            permissionOverrideService: Services.PermissionOverride.Contract;
            repositories: Repositories.Context;
        };

        type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
    }

    namespace Repositories {
        type Context = {
            permissionOverrides: globalThis.Repositories.PermissionOverride.Contract;
            permissions: globalThis.Repositories.Permission.Contract;
            realms: globalThis.Repositories.Realm.Contract;
        };

        type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
    }

    namespace Config {
        type Props = {
            overrideLimit?: number;
        };
    }

    namespace SeedSystemRealm {
        type Props = Suite;

        type Result = Promise<Entities.Realm>;

        type Signature = (suite: Props) => Result;
    }
}
