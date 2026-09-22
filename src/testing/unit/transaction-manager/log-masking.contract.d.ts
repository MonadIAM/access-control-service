declare namespace Unit.TransactionManager.LogMasking {
    interface Contract extends Unit.Domain.Core.Contract {
        auditTargets: AuditTargetsFactory.Signature;
        vault: VaultFactory.Signature;
        service: Service.Signature;
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
            hmacBatch?: CommonServices.VaultTransit.HmacBatch.Signature;
            sign?: CommonServices.VaultTransit.Sign.Signature;
        };

        type Result = {
            service: CommonServices.VaultTransit.Contract;
            hmacBatch: Jest.Mock<CommonServices.VaultTransit.HmacBatch.Signature>;
            sign: Jest.Mock<CommonServices.VaultTransit.Sign.Signature>;
        };

        type Signature = (props?: Props) => Result;
    }

    namespace Service {
        type Props = {
            vault?: VaultFactory.Result;
        };

        type Result = {
            service: globalThis.TransactionManager.LogMasking.Contract;
            vault: VaultFactory.Result;
        };

        type Signature = (props?: Props) => Result;
    }
}
