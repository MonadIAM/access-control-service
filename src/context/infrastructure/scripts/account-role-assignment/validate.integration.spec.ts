import { beforeEach, describe, expect, it } from "@jest/globals";

import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { redisSuite } from "~testing/integration/containers/redis.suite";

import { ProjectionScript } from "../index";

describe("[Projection] - account-role-assignment/validate", () => {
    const redis = redisSuite(ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_VALIDATE);
    let fixture: LifecycleProjectionFixture;

    beforeEach(() => {
        fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());
    });

    it("[case] - validates duplicate identities once and returns JSON arrays", async () => {
        // Arrange
        const scenario = await fixture.createScenario();
        await fixture.assignRole(scenario);
        const missing = { ...scenario, role: "missing-role" };

        // Act
        const result = await fixture.execute(ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_VALIDATE, {
            items: [scenario, scenario, missing, missing],
        });
        const empty = await fixture.execute(ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_VALIDATE, { items: [] });
        const found = await fixture.execute(ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_VALIDATE, { items: [scenario] });

        // Assert
        const groups = [{ realm: scenario.realm, account: scenario.account, remaining: 0 }];
        expect(JSON.parse(result as string)).toEqual({ groups, missing: [missing.role] });
        expect(JSON.parse(empty as string)).toEqual({ groups: [], missing: [] });
        expect(JSON.parse(found as string)).toEqual({ groups, missing: [] });
    });
});
