declare namespace Unit.Queries.ChangeLog {
    interface Contract extends Domain.Core.Contract {
        queries: Queries.Signature;
    }

    namespace Repository {
        type Contract = {
            findUniqueOrThrow: Jest.Mock<Repositories.ChangeLog.QueryContract["findUniqueOrThrow"]>;
            findMany: Jest.Mock<Repositories.ChangeLog.QueryContract["findMany"]>;
        };
    }

    namespace Queries {
        type Result = {
            queries: globalThis.Queries.ChangeLog.Contract;
            repository: Repository.Contract;
        };

        type Signature = () => Result;
    }
}
