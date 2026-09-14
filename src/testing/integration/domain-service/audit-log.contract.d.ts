import type { AuditLogRepository } from "~context/infrastructure/repositories/audit-log.repository";
import type { AuditLogService } from "~context/domain/services/audit-log.service";

declare global {
    namespace Integration {
        namespace Domain {
            namespace AuditLog {
                type Suite = Postgres.Suite.Contract<Service.Context, Fixtures.Core.Contract>;

                interface Contract {
                    readonly repositories: Repositories.Signature;
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Context = {
                        readonly auditLogService: AuditLogService;
                        readonly repositories: Repositories.Context;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext) => Context;
                }

                namespace Repositories {
                    type Context = {
                        readonly auditLogs: AuditLogRepository;
                    };

                    type Signature = (context: Postgres.Suite.FactoryContext) => Context;
                }
            }
        }
    }
}
