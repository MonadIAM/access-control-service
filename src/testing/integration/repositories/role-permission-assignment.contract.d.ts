declare namespace Fixtures.RolePermissionAssignment {
    interface Contract extends Fixtures.Core.Contract {
        limitScenario: LimitScenario.Signature;
    }

    namespace LimitScenario {
        type Result = Promise<{
            expectedOverlappingResult: boolean;
            expectedAdditionalResult: boolean;
            role: Entities.Role;
            permissions: {
                overlapping: Entities.Permission;
                additional: Entities.Permission;
                existing: Entities.Permission;
                revoked: Entities.Permission;
            };
        }>;

        type Signature = () => Result;
    }
}
