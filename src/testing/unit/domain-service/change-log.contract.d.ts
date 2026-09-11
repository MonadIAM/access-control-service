import type { ChangeLogService } from "~context/domain/services/change-log.service";

declare global {
    namespace Unit {
        namespace Domain {
            namespace ChangeLog {
                interface Contract extends Core.Contract {
                    readonly service: Service.Signature;
                }

                namespace Service {
                    type Result = {
                        readonly repositories: RepositoryMocks.Contract;
                        readonly transaction: Core.Transaction;
                        readonly service: ChangeLogService;
                    };

                    type Signature = () => Result;
                }
            }
        }
    }
}
