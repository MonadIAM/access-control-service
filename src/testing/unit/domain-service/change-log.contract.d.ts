declare namespace Unit.Domain.ChangeLog {
    interface Contract extends Core.Contract {
        service: Service.Signature;
    }

    namespace Service {
        type Result = {
            repositories: RepositoryMocks.Contract;
            service: Services.ChangeLog.Contract;
            transaction: Core.Transaction;
        };

        type Signature = () => Result;
    }
}
