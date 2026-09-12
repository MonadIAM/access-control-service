import { randomUUID } from "node:crypto";

import { CoreFixture } from "./core.fixture";

export class AccountRoleAssignmentFixture extends CoreFixture implements Fixtures.AccountRoleAssignment.Contract {
    /**
     * Builds active, revoked, expired, and additional role assignments to verify per-account assignment limits.
     */
    public async limitScenario(): Fixtures.AccountRoleAssignment.LimitScenario.Result {
        const account = randomUUID();
        const realm = await this.createRealm({ code: "account-role-limit", name: "Account Role Limit" });
        const existingRole = await this.createRole({ realm, code: "roles.existing", name: "Existing Role" });
        const overlappingRole = await this.createRole({ realm, code: "roles.overlapping", name: "Overlapping Role" });
        const revokedRole = await this.createRole({ realm, code: "roles.revoked", name: "Revoked Role" });
        const expiredRole = await this.createRole({ realm, code: "roles.expired", name: "Expired Role" });
        const additionalRole = await this.createRole({ realm, code: "roles.additional", name: "Additional Role" });

        await this.createAccountRoleAssignment({ realm, role: existingRole, account });
        await this.createAccountRoleAssignment({ realm, role: overlappingRole, account });
        await this.createAccountRoleAssignment({ realm, role: revokedRole, account, isRevoked: true });
        await this.createAccountRoleAssignment({
            expiresAt: new Date("2020-01-01T00:00:00.000Z"),
            role: expiredRole,
            account,
            realm,
        });

        return {
            expectedOverlappingResult: false,
            expectedAdditionalResult: true,
            account,
            roles: {
                overlapping: overlappingRole,
                additional: additionalRole,
                existing: existingRole,
                revoked: revokedRole,
            },
        };
    }
}
