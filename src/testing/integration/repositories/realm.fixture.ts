import { randomUUID } from "node:crypto";

import { CoreFixture } from "./core.fixture";

export class RealmFixture extends CoreFixture implements Fixtures.Realm.Contract {
    /**
     * Builds realms including a revoked one to verify all rows occupy the configured per-account realm limit.
     */
    public async limitScenario(): Fixtures.Realm.LimitScenario.Result {
        const account = randomUUID();

        await this.createRealm({ owner: account, code: "limits.first", name: "First Limit Realm" });
        await this.createRealm({ owner: account, code: "limits.second", name: "Second Limit Realm" });
        await this.createRealm({ owner: account, code: "limits.revoked", name: "Revoked Limit Realm", isRevoked: true });
        await this.createRealm({ code: "limits.external", name: "External Limit Realm" });

        return {
            expectedCountOneResult: true,
            expectedCountTwoResult: true,
            account,
        };
    }

    /**
     * Builds ordered realms to verify lookup pagination and owner scoping.
     */
    public async lookupScenario(): Fixtures.Realm.LookupScenario.Result {
        const betaRealm = await this.createRealm({ code: "beta", name: "Beta Realm" });
        const alphaRealm = await this.createRealm({ code: "alpha", name: "Alpha Realm" });
        await this.createRealm({ code: "gamma", name: "Gamma Realm" });

        return {
            expectedFirstPageCodes: ["alpha", "beta"],
            realms: [betaRealm, alphaRealm],
            expectedTotal: 2,
        };
    }

    /**
     * Builds searchable realms to verify trigram lookup tie-breakers and owner scoping.
     */
    public async lookupSearchScenario(): Fixtures.Realm.LookupSearchScenario.Result {
        const accessAlphaRealm = await this.createRealm({ code: "access-alpha", name: "Access Alpha" });
        const alphaAccessRealm = await this.createRealm({ code: "alpha-access", name: "Alpha Access" });
        await this.createRealm({ code: "billing-audit", name: "Billing Audit" });

        return {
            expectedCodes: ["access-alpha", "alpha-access"],
            realms: [accessAlphaRealm, alphaAccessRealm],
            term: "Alpha Access",
        };
    }
}
