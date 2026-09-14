import type { ChangeLogRepository } from "~context/infrastructure/repositories/change-log.repository";
import type { ChangeLogService } from "~context/domain/services/change-log.service";

declare global {
    namespace Integration {
        namespace Domain {
            namespace ChangeLog {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly changeLogService: ChangeLogService;
                        readonly repositories: Repositories.Context;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext) => Context;
                }

                namespace Repositories {
                    type Context = {
                        readonly changeLogs: ChangeLogRepository;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext) => Context;
                }
            }
        }
    }
}
