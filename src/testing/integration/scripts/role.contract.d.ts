import Redis from "ioredis";

import type { Outbox } from "~common/transaction-manager/entities";

declare global {
    namespace Integration.Projection.Role {
        interface Contract {
            consumeProjection: ConsumeProjection.Signature;
            loadClosure: LoadClosure.Signature;
            service: Service.Signature;
            pathKey: PathKey.Signature;
        }

        namespace Service {
            type Context = {
                transactional: Integration.TransactionalHelper.CreateTransactionalServiceContext.Result;
                commands: Commands.Role.Contract;
                consumed: Set<string>;
            };

            type Signature = (context: Postgres.Suite.FactoryContext) => Context;
        }

        namespace ConsumeProjection {
            type Props = {
                executor: InfrastructureServices.ScriptExecutor.Contract;
                context: Service.Context;
            };

            type Result = Promise<Outbox[]>;

            type Signature = (props: Props) => Result;
        }

        namespace LoadClosure {
            type Props = {
                transaction: ORM.EntityManager;
                realm: string;
                redis: Redis;
            };

            type Result = Promise<{
                projected: string[][];
                sql: string[];
            }>;

            type Signature = (props: Props) => Result;
        }

        namespace PathKey {
            type Signature = (ancestor: Entities.Role, descendant: Entities.Role, depth: number) => string;
        }
    }

    namespace Fixtures.Projection.Role {
        interface Contract extends Fixtures.Core.Contract {
            purgeSubtreeScenario: PurgeSubtreeScenario.Signature;
            createTree: CreateTree.Signature;
        }

        namespace CreateTree {
            type Result = Integration.Domain.Role.CreateDeepRoleTree.Result;

            type Signature = () => Result;
        }

        namespace PurgeSubtreeScenario {
            type Props = {
                accounts: number;
            };

            type Result = Promise<{
                tree: Awaited<CreateTree.Result>;
                permission: Entities.Permission;
                foreignRole: Entities.Role;
                foreign: Entities.Realm;
                accounts: string[];
            }>;

            type Signature = (props: Props) => Result;
        }

        namespace MoveScenario {
            type Result = Promise<{
                tree: Awaited<CreateTree.Result>;
                account: string;
                previous: Entities.Permission;
                next: Entities.Permission;
            }>;
        }
    }
}
