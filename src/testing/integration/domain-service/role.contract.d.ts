declare namespace Integration.Domain.Role {
    type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

    interface Contract {
        createDeepRoleTree: CreateDeepRoleTree.Signature;
        createHierarchy: CreateHierarchy.Signature;
        repositories: Repositories.Signature;
        service: Service.Signature;
    }

    namespace Service {
        type Context = {
            transactional: Integration.TransactionalHelper.CreateTransactionalServiceContext.Result;
            roleService: Services.Role.Contract;
            repositories: Repositories.Context;
        };

        type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
    }

    namespace Repositories {
        type Context = {
            roleClosures: globalThis.Repositories.RoleClosure.Contract;
            realms: globalThis.Repositories.Realm.Contract;
            roles: globalThis.Repositories.Role.Contract;
        };

        type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
    }

    namespace Config {
        type Props = {
            subtreeSizeLimit?: number;
            roleLimit?: number;
        };
    }

    namespace CreateHierarchy {
        type Props = {
            fixtures: Fixtures.Core.Contract;
            descendant: Entities.Role;
            ancestor: Entities.Role;
            realm: Entities.Realm;
            depth: number;
        };

        type Result = Promise<void>;

        type Signature = (props: Props) => Result;
    }

    namespace CreateDeepRoleTree {
        type Props = {
            fixtures: Fixtures.Core.Contract;
            code: string;
        };

        type Result = Promise<{
            roles: {
                grandchild: Entities.Role;
                detached: Entities.Role;
                parent: Entities.Role;
                child: Entities.Role;
                root: Entities.Role;
            };
            realm: Entities.Realm;
        }>;

        type Signature = (props: Props) => Result;
    }
}
