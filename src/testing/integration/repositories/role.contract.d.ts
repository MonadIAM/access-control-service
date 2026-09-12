declare namespace Fixtures {
    namespace Role {
        interface Contract extends Fixtures.Core.Contract {
            delegableRevokedScenario: DelegableRevokedScenario.Signature;
            delegableExpiredScenario: DelegableExpiredScenario.Signature;
            delegableRealmScenario: DelegableRealmScenario.Signature;
            delegablePageScenario: DelegablePageScenario.Signature;
            effectivePageScenario: EffectivePageScenario.Signature;
            lookupSearchScenario: LookupSearchScenario.Signature;
            delegableScenario: DelegableScenario.Signature;
            effectiveScenario: EffectiveScenario.Signature;
            hierarchyScenario: HierarchyScenario.Signature;
            accountsScenario: AccountsScenario.Signature;
            lookupScenario: LookupScenario.Signature;
            limitScenario: LimitScenario.Signature;
        }

        namespace AccountsScenario {
            type Result = Promise<{
                expectedAccounts: string[];
                role: Entities.Role;
            }>;

            type Signature = () => Result;
        }

        namespace DelegableRevokedScenario {
            type Result = Promise<{
                expectedRoleCodes: string[];
                realm: Entities.Realm;
                account: string;
            }>;

            type Signature = () => Result;
        }

        namespace DelegableExpiredScenario {
            type Result = Promise<{
                expectedRoleCodes: string[];
                realm: Entities.Realm;
                account: string;
            }>;

            type Signature = () => Result;
        }

        namespace DelegableRealmScenario {
            type Result = Promise<{
                expectedRoleCodes: string[];
                realm: Entities.Realm;
                account: string;
            }>;

            type Signature = () => Result;
        }

        namespace DelegablePageScenario {
            type Result = Promise<{
                expectedOrderedCodes: string[];
                realm: Entities.Realm;
                account: string;
            }>;

            type Signature = () => Result;
        }

        namespace EffectivePageScenario {
            type Result = Promise<{
                expectedOrderedCodes: string[];
                realm: Entities.Realm;
                account: string;
            }>;

            type Signature = () => Result;
        }

        namespace DelegableScenario {
            type Result = Promise<{
                expectedRoleCodes: string[];
                realm: Entities.Realm;
                account: string;
            }>;

            type Signature = () => Result;
        }

        namespace EffectiveScenario {
            type Result = Promise<{
                expectedRoleCodes: string[];
                realm: Entities.Realm;
                account: string;
            }>;

            type Signature = () => Result;
        }

        namespace HierarchyScenario {
            type Result = Promise<{
                expectedDirectDescendantCodes: string[];
                expectedDirectAncestorCodes: string[];
                expectedDescendantCodes: string[];
                expectedAncestorCodes: string[];
                expectedGraphEdges: number;
                expectedGraphNodes: number;
                descendant: Entities.Role;
                realm: Entities.Realm;
                root: Entities.Role;
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

        namespace LookupScenario {
            type Result = Promise<{
                expectedFirstPageCodes: string[];
                expectedTotal: number;
                realm: Entities.Realm;
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
    }
}
