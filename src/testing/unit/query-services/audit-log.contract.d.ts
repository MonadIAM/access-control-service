declare namespace Unit.Queries.AuditLog {
    interface Contract extends Domain.Core.Contract {
        queries: Queries.Signature;
    }

    namespace Repository {
        type Contract = {
            findUniqueOrThrow: Jest.Mock<Repositories.AuditLog.QueryContract["findUniqueOrThrow"]>;
            findMany: Jest.Mock<Repositories.AuditLog.QueryContract["findMany"]>;
        };
    }

    namespace Queries {
        type Result = {
            queries: globalThis.Queries.AuditLog.Contract;
            repository: Repository.Contract;
        };

        type Signature = () => Result;
    }
}
