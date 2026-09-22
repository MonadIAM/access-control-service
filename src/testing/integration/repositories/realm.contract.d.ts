declare namespace Fixtures.Realm {
    interface Contract extends Fixtures.Core.Contract {
        lookupSearchScenario: LookupSearchScenario.Signature;
        lookupScenario: LookupScenario.Signature;
        limitScenario: LimitScenario.Signature;
    }

    namespace LimitScenario {
        type Result = Promise<{
            expectedCountOneResult: boolean;
            expectedCountTwoResult: boolean;
            account: string;
        }>;

        type Signature = () => Result;
    }

    namespace LookupScenario {
        type Result = Promise<{
            expectedFirstPageCodes: string[];
            realms: Entities.Realm[];
            expectedTotal: number;
        }>;

        type Signature = () => Result;
    }

    namespace LookupSearchScenario {
        type Result = Promise<{
            realms: Entities.Realm[];
            expectedCodes: string[];
            term: string;
        }>;

        type Signature = () => Result;
    }
}
