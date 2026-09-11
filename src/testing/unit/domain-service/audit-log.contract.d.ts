import type { AuditLogService } from "~context/domain/services/audit-log.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace AuditLog {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Result = {
                        readonly repositories: RepositoryMocks.Contract;
                        readonly transaction: Core.Transaction;
                        readonly service: AuditLogService;
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
