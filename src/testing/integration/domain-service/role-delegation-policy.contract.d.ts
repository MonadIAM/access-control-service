declare namespace Integration.Domain.RoleDelegationPolicy {
    type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

    interface Contract {
        repositories: Repositories.Signature;
        service: Service.Signature;
    }

    namespace Service {
        type Context = {
            roleDelegationPolicyService: Services.RoleDelegationPolicy.Contract;
            repositories: Repositories.Context;
        };

        type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
    }

    namespace Repositories {
        type Context = {
            roleDelegationPolicies: globalThis.Repositories.RoleDelegationPolicy.Contract;
            realms: globalThis.Repositories.Realm.Contract;
            roles: globalThis.Repositories.Role.Contract;
        };

        type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
    }

    namespace Config {
        type Props = {
            policyLimit?: number;
        };
    }
}
