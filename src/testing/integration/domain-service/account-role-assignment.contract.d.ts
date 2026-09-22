declare namespace Integration.Domain.AccountRoleAssignment {
    type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

    interface Contract {
        repositories: Repositories.Signature;
        service: Service.Signature;
    }

    namespace Service {
        type Context = {
            accountRoleAssignmentService: Services.AccountRoleAssignment.Contract;
            repositories: Repositories.Context;
        };

        type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
    }

    namespace Repositories {
        type Context = {
            accountRoleAssignments: globalThis.Repositories.AccountRoleAssignment.Contract;
            roleDelegationPolicies: globalThis.Repositories.RoleDelegationPolicy.Contract;
            roleConflictGroups: globalThis.Repositories.RoleConflictGroup.Contract;
            realms: globalThis.Repositories.Realm.Contract;
            roles: globalThis.Repositories.Role.Contract;
        };

        type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
    }

    namespace Config {
        type Props = {
            accountRoleLimit?: number;
        };
    }
}
