declare namespace Fixtures {
    namespace RoleConflictMember {
        interface Contract extends Fixtures.Core.Contract {
            limitScenario: LimitScenario.Signature;
        }

        namespace LimitScenario {
            type Result = Promise<{
                group: Entities.RoleConflictGroup;
                expectedCountOneResult: boolean;
                expectedCountTwoResult: boolean;
            }>;

            type Signature = () => Result;
        }
    }
}
