import type { RoleClosureRepository } from "~context/infrastructure/repositories/role-closure.repository";
import type { RealmRepository } from "~context/infrastructure/repositories/realm.repository";
import type { RoleRepository } from "~context/infrastructure/repositories/role.repository";
import type { RoleService } from "~context/domain/services/role.service";

declare global {
    namespace Integration {
        namespace Domain {
            namespace Role {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly createDeepRoleTree: CreateDeepRoleTree.Signature;
                    readonly createHierarchy: CreateHierarchy.Signature;
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly roleService: RoleService;
                        readonly repositories: Repositories.Context;
                        readonly transactional: Integration.TransactionalHelper.CreateTransactionalServiceContext.Result;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
                }

                namespace Repositories {
                    type Context = {
                        readonly roleClosures: RoleClosureRepository;
                        readonly realms: RealmRepository;
                        readonly roles: RoleRepository;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext, props?: Config.Props) => Context;
                }

                namespace Config {
                    type Props = {
                        readonly roleLimit?: number;
                        readonly subtreeSizeLimit?: number;
                    };
                }

                namespace CreateHierarchy {
                    type Props = {
                        readonly descendant: Entities.Role;
                        readonly ancestor: Entities.Role;
                        readonly fixtures: Fixtures.Core.Contract;
                        readonly realm: Entities.Realm;
                        readonly depth: number;
                    };

                    type Result = Promise<void>;

                    type Signature = (props: Props) => Result;
                }

                namespace CreateDeepRoleTree {
                    type Props = {
                        readonly fixtures: Fixtures.Core.Contract;
                        readonly code: string;
                    };

                    type Result = Promise<{
                        readonly roles: {
                            readonly grandchild: Entities.Role;
                            readonly detached: Entities.Role;
                            readonly parent: Entities.Role;
                            readonly child: Entities.Role;
                            readonly root: Entities.Role;
                        };
                        readonly realm: Entities.Realm;
                    }>;

                    type Signature = (props: Props) => Result;
                }
            }
        }
    }
}
