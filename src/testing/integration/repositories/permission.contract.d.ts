declare namespace Fixtures {
    namespace Permission {
        interface Contract extends Fixtures.Core.Contract {
            lookupSearchScenario: LookupSearchScenario.Signature;
            filteredPageScenario: FilteredPageScenario.Signature;
            revocationScenario: RevocationScenario.Signature;
            inheritedScenario: InheritedScenario.Signature;
            accountsScenario: AccountsScenario.Signature;
            lookupScenario: LookupScenario.Signature;
            limitScenario: LimitScenario.Signature;
        }

        namespace InheritedScenario {
            type Result = Promise<{
                expectedPermissionCodes: string[];
                realm: Entities.Realm;
                account: string;
            }>;

            type Signature = () => Result;
        }

        namespace AccountsScenario {
            type Result = Promise<{
                permission: Entities.Permission;
                expectedAccounts: string[];
            }>;

            type Signature = () => Result;
        }

        namespace RevocationScenario {
            type Result = Promise<{
                expectedPermissionCodes: string[];
                realm: Entities.Realm;
                account: string;
            }>;

            type Signature = () => Result;
        }

        namespace FilteredPageScenario {
            type Result = Promise<{
                expectedOrderedCodes: string[];
                expectedPageSize: number;
                expectedTotal: number;
                realm: Entities.Realm;
                account: string;
            }>;

            type Signature = () => Result;
        }

        namespace LookupSearchScenario {
            type Result = Promise<{
                expectedCodes: string[];
                realm: Entities.Realm;
                term: string;
            }>;

            type Signature = () => Result;
        }

        namespace LimitScenario {
            type Result = Promise<{
                expectedCountTwoResult: boolean;
                expectedCountOneResult: boolean;
                realm: Entities.Realm;
            }>;

            type Signature = () => Result;
        }

        namespace LookupScenario {
            type Result = Promise<{
                expectedFirstPageCodes: string[];
                expectedTotal: number;
                realm: Entities.Realm;
            }>;

            type Signature = () => Result;
        }
    }
}
