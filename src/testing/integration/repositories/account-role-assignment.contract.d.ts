declare namespace Fixtures.AccountRoleAssignment {
    interface Contract extends Fixtures.Core.Contract {
        limitScenario: LimitScenario.Signature;
    }

    namespace LimitScenario {
        type Result = Promise<{
            expectedOverlappingResult: boolean;
            expectedAdditionalResult: boolean;
            account: string;
            roles: {
                overlapping: Entities.Role;
                additional: Entities.Role;
                existing: Entities.Role;
                revoked: Entities.Role;
            };
        }>;

        type Signature = () => Result;
    }
}
