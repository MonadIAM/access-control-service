declare namespace Fixtures.PermissionOverride {
    interface Contract extends Fixtures.Core.Contract {
        limitScenario: LimitScenario.Signature;
    }

    namespace LimitScenario {
        type Result = Promise<{
            expectedCountOneResult: boolean;
            expectedCountTwoResult: boolean;
            realm: Entities.Realm;
            account: string;
        }>;

        type Signature = () => Result;
    }
}
