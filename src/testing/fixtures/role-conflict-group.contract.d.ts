declare namespace Fixtures {
    namespace RoleConflictGroup {
        interface Contract extends Fixtures.Core.Contract {
            violatingGroupsExpiredScenario: ViolatingGroupsExpiredScenario.Signature;
            violatingGroupsRealmScenario: ViolatingGroupsRealmScenario.Signature;
            violatingAccountsScenario: ViolatingAccountsScenario.Signature;
            violatingGroupsScenario: ViolatingGroupsScenario.Signature;
            violatedExpiredScenario: ViolatedExpiredScenario.Signature;
            violatedGroupsScenario: ViolatedGroupsScenario.Signature;
            limitScenario: LimitScenario.Signature;
        }

        namespace ViolatingAccountsScenario {
            type Result = Promise<{
                expectedAccounts: string[];
                roles: Entities.Role[];
                realm: Entities.Realm;
                maxAllowed: number;
            }>;

            type Signature = () => Result;
        }

        namespace ViolatedExpiredScenario {
            type Result = Promise<{
                candidateRoles: Entities.Role[];
                expectedGroupCodes: string[];
                realm: Entities.Realm;
                account: string;
            }>;

            type Signature = () => Result;
        }

        namespace ViolatedGroupsScenario {
            type Result = Promise<{
                candidateRoles: Entities.Role[];
                expectedGroupCodes: string[];
                realm: Entities.Realm;
                account: string;
            }>;

            type Signature = () => Result;
        }

        namespace ViolatingGroupsExpiredScenario {
            type Result = Promise<{
                groups: Entities.RoleConflictGroup[];
                expectedResult: boolean;
                realm: Entities.Realm;
            }>;

            type Signature = () => Result;
        }

        namespace ViolatingGroupsRealmScenario {
            type Result = Promise<{
                groups: Entities.RoleConflictGroup[];
                expectedResult: boolean;
                realm: Entities.Realm;
            }>;

            type Signature = () => Result;
        }

        namespace ViolatingGroupsScenario {
            type Result = Promise<{
                groups: Entities.RoleConflictGroup[];
                expectedResult: boolean;
                realm: Entities.Realm;
            }>;

            type Signature = () => Result;
        }

        namespace LimitScenario {
            type Result = Promise<{
                expectedCountOneResult: boolean;
                expectedCountTwoResult: boolean;
                realm: Entities.Realm;
            }>;

            type Signature = () => Result;
        }
    }
}
