declare namespace Integration.Domain.RolePermissionAssignment {
    type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

    interface Contract {
        seedSystemRealm: SeedSystemRealm.Signature;
        repositories: Repositories.Signature;
        service: Service.Signature;
    }

    namespace Service {
        type Context = {
            rolePermissionAssignmentService: Services.RolePermissionAssignment.Contract;
            repositories: Repositories.Context;
        };

        type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
    }

    namespace Repositories {
        type Context = {
            rolePermissionAssignments: globalThis.Repositories.RolePermissionAssignment.Contract;
            permissions: globalThis.Repositories.Permission.Contract;
            realms: globalThis.Repositories.Realm.Contract;
            roles: globalThis.Repositories.Role.Contract;
        };

        type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
    }

    namespace Config {
        type Props = {
            permissionLimit?: number;
        };
    }

    namespace SeedSystemRealm {
        type Props = Suite;

        type Result = Promise<Entities.Realm>;

        type Signature = (suite: Props) => Result;
    }
}
