declare namespace Integration.Domain.Realm {
    type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

    interface Contract {
        seedSystemPermissions: SeedSystemPermissions.Signature;
        repositories: Repositories.Signature;
        service: Service.Signature;
    }

    namespace Service {
        type Context = {
            repositories: Repositories.Context;
            realmService: Services.Realm.Contract;
        };

        type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
    }

    namespace Repositories {
        type Context = {
            accountRoleAssignments: globalThis.Repositories.AccountRoleAssignment.Contract;
            permissionOverrides: globalThis.Repositories.PermissionOverride.Contract;
            permissions: globalThis.Repositories.Permission.Contract;
            realms: globalThis.Repositories.Realm.Contract;
            roles: globalThis.Repositories.Role.Contract;
        };

        type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
    }

    namespace Config {
        type Props = {
            realmLimit?: number;
        };
    }

    namespace SeedSystemPermissions {
        type Props = Suite;

        type Result = Promise<Entities.Realm>;

        type Signature = (suite: Props) => Result;
    }
}
