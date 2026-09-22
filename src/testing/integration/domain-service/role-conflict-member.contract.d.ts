declare namespace Integration.Domain.RoleConflictMember {
    type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

    interface Contract {
        repositories: Repositories.Signature;
        service: Service.Signature;
    }

    namespace Service {
        type Context = {
            roleConflictMemberService: Services.RoleConflictMember.Contract;
            repositories: Repositories.Context;
        };

        type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
    }

    namespace Repositories {
        type Context = {
            roleConflictMembers: globalThis.Repositories.RoleConflictMember.Contract;
            roleConflictGroups: globalThis.Repositories.RoleConflictGroup.Contract;
            roles: globalThis.Repositories.Role.Contract;
        };

        type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
    }

    namespace Config {
        type Props = {
            membersLimit?: number;
        };
    }
}
