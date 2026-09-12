import type { LogMaskingService } from "~common/transaction-manager/services/log-masking.service";

declare global {
    namespace Unit {
        namespace TransactionManager {
            namespace LogMasking {
                interface Contract extends Unit.Domain.Core.Contract {
                    readonly auditTargets: AuditTargetsFactory.Signature;
                    readonly vault: VaultFactory.Signature;
                    readonly service: Service.Signature;
                }

                namespace AuditTargetsFactory {
                    type Result = {
                        path: (string | number)[];
                        value: string;
                    }[];

                    type Signature = () => Result;
                }

                namespace VaultFactory {
                    type Props = {
                        readonly hmacBatch?: CommonServices.VaultTransit.HmacBatch.Signature;
                        readonly sign?: CommonServices.VaultTransit.Sign.Signature;
                    };

                    type Result = {
                        readonly service: CommonServices.VaultTransit.Contract;
                        readonly hmacBatch: Unit.Domain.Mock;
                        readonly sign: Unit.Domain.Mock;
                    };

                    type Signature = (props?: Props) => Result;
                }

                namespace Service {
                    type Props = {
                        readonly vault?: VaultFactory.Result;
                    };

                    type Result = {
                        readonly service: LogMaskingService;
                        readonly vault: VaultFactory.Result;
                    };

                    type Signature = (props?: Props) => Result;
                }
            }
        }
    }
}
