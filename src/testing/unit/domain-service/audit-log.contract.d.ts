declare namespace Unit.Domain.AuditLog {
    interface Contract extends Core.Contract {
        service: Service.Signature;
    }

    namespace Service {
        type Result = {
            repositories: RepositoryMocks.Contract;
            service: Services.AuditLog.Contract;
            transaction: Core.Transaction;
        };

        type Signature = () => Result;
    }
}
