import { bootstrap } from "@monadiam/shared/datasets/system/access-control";
import { beforeEach, describe, expect, it } from "@jest/globals";
import { SYSTEM_REALM_ID } from "@monadiam/shared";
import { randomUUID } from "node:crypto";

import { MaterializeProjectionFixture } from "~testing/integration/scripts/materialize.fixture";
import { MaterializeProjectionHelpers } from "~testing/integration/scripts/materialize.helpers";
import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { redisSuite } from "~testing/integration/containers/redis.suite";
import { Realm } from "~context/domain/entities";

import { ProjectionScript } from "../index";

describe("[Projection] - realm/create", () => {
    const redis = redisSuite(ProjectionScript.REALM_CREATE);
    let fixture: LifecycleProjectionFixture;

    beforeEach(() => {
        fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());
    });

    it("[case] - creates canonical sources and materialized access", async () => {
        // Arrange
        const scenario = await fixture.createScenario();
        const { realm, role, permission, account } = scenario;
        await fixture.assignRole(scenario);
        await fixture.grantPermission(scenario);
        fixture.data.realms = fixture.data.realms.filter((row) => row.id !== scenario.realm);
        await fixture.restore();

        // Act
        await fixture.execute(ProjectionScript.REALM_CREATE, {
            realm,
            roles: [role],
            paths: [{ ancestor: role, descendant: role, depth: 0 }],
            permissionRealm: realm,
            rolePermissionAssignments: [{ assignment: scenario.grant, role, permission, scope: "REALM" }],
            accountRoleAssignments: [{ assignment: scenario.assignment, role, account }],
        });

        // Assert
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm}:${account}:${realm}`)).toEqual({
            [scenario.code]: "0:0",
        });
        expect(await redis.client().hget(`projection:realm:${realm}`, "isRevoked")).toBe("0");
    });
});

describe("[Projection] - realm/create event symmetry", () => {
    const redis = redisSuite(ProjectionScript.REALM_CREATE);
    const helpers = new MaterializeProjectionHelpers();
    const suite = postgresSuite({
        repository: (context) => helpers.service(context, redis.executor(), redis.client()),
        fixture: (manager) => new MaterializeProjectionFixture(manager),
    });

    it("[case] - agrees with PostgreSQL after creation", async () => {
        // Arrange
        const fixture = suite.fixtures();
        await fixture.bootstrapPermissions();
        const account = randomUUID();
        await fixture.snapshot(redis.client());
        const context = suite.repository();
        const meta: Extract.Meta = { ip: "127.0.0.1", userAgent: "projection-create" };

        // Act
        await context.commands.realm.create({
            actor: account,
            context: meta,
            input: { code: "test.bootstrap", name: "Bootstrap" },
        });

        // Assert
        const realm = await suite.transaction((transaction) => transaction.findOneOrFail(Realm, { owner: account }));
        await helpers.expectSymmetry({
            context,
            executor: redis.executor(),
            redis: redis.client(),
            realm: realm.id,
            account,
            permissionRealm: SYSTEM_REALM_ID,
            expected: [...bootstrap.ADMIN_PERMISSION_CODES],
        });
    });
});
