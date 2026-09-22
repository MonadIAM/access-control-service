declare namespace Fixtures.RoleDelegationPolicy {
    interface Contract extends Fixtures.Core.Contract {
        duplicateTargetsScenario: DuplicateTargetsScenario.Signature;
        expiredActorScenario: ExpiredActorScenario.Signature;
        transitiveScenario: TransitiveScenario.Signature;
        allowedScenario: AllowedScenario.Signature;
        limitScenario: LimitScenario.Signature;
    }

    namespace AllowedScenario {
        type Result = Promise<{
            foreignDeniedRoles: Entities.Role[];
            allowedRoles: Entities.Role[];
            deniedRoles: Entities.Role[];
            realm: Entities.Realm;
            actor: string;
        }>;

        type Signature = () => Result;
    }

    namespace ExpiredActorScenario {
        type Result = Promise<{
            deniedRoles: Entities.Role[];
            realm: Entities.Realm;
            actor: string;
        }>;

        type Signature = () => Result;
    }

    namespace DuplicateTargetsScenario {
        type Result = Promise<{
            requestedRoles: Entities.Role[];
            expectedResult: boolean;
            realm: Entities.Realm;
            actor: string;
        }>;

        type Signature = () => Result;
    }

    namespace LimitScenario {
        type Result = Promise<{
            expectedCountOneResult: boolean;
            expectedCountTwoResult: boolean;
            delegator: Entities.Role;
            realm: Entities.Realm;
        }>;

        type Signature = () => Result;
    }

    namespace TransitiveScenario {
        type Result = Promise<{
            realmBlockedRole: Entities.Role;
            reachableRole: Entities.Role;
            blockedRole: Entities.Role;
            from: Entities.Role;
        }>;

        type Signature = () => Result;
    }
}
