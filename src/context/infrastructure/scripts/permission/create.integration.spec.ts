import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "@jest/globals";

import { MaterializeProjectionFixture } from "~testing/integration/scripts/materialize.fixture";
import { MaterializeProjectionHelpers } from "~testing/integration/scripts/materialize.helpers";
import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { redisSuite } from "~testing/integration/containers/redis.suite";
import { Permission } from "~context/domain/entities";

import { ProjectionScript } from "../index";

describe("[Projection] - permission/create", () => {
    const redis = redisSuite(ProjectionScript.PERMISSION_CREATE);
    let fixture: LifecycleProjectionFixture;

    beforeEach(() => {
        fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());
    });

    it("[case] - creates canonical sources and materialized access", async () => {
        // Arrange
        const scenario = await fixture.createScenario();
        const { realm, permission, account } = scenario;
        await fixture.assignRole(scenario);
        await fixture.grantPermission(scenario);
        fixture.data.permissions = fixture.data.permissions.filter((row) => row.id !== scenario.permission);
        await fixture.restore();

        const sibling = await fixture.siblingPermission(scenario);
        const before = await redis.client().hgetall(`projection:permissions:${realm}`);

        // Act
        await fixture.execute(ProjectionScript.PERMISSION_CREATE, { realm, permission, code: scenario.code });

        // Assert
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm}:${account}:${realm}`)).toEqual({
            [scenario.code]: "0:0",
            [sibling.code]: "0:0",
        });
        expect(await redis.client().hget(`projection:permissions:${realm}`, `${permission}:isRevoked`)).toBe("0");

        expect(await redis.client().hgetall(`projection:permissions:${realm}`)).toEqual({
            ...before,
            [`${permission}:isRevoked`]: "0",
            [`${permission}:code`]: scenario.code,
        });
    });
});

describe("[Projection] - permission/create event symmetry", () => {
    const redis = redisSuite(ProjectionScript.PERMISSION_CREATE);
    const helpers = new MaterializeProjectionHelpers();
    const suite = postgresSuite({
        repository: (context) => helpers.service(context, redis.executor(), redis.client()),
        fixture: (manager) => new MaterializeProjectionFixture(manager),
    });

    it("[case] - agrees with PostgreSQL after creation", async () => {
        // Arrange
        const fixture = suite.fixtures();
        const { realm, account } = await fixture.scenario();
        await fixture.snapshot(redis.client());
        const context = suite.repository();
        const meta: Extract.Meta = { ip: "127.0.0.1", userAgent: "projection-create" };
        const existing = await redis.client().hgetall(`projection:permissions:${realm.id}`);

        // Act
        await context.commands.permission.create({
            realm: realm.id,
            actor: randomUUID(),
            context: meta,
            input: { code: "test.created", name: "Created permission" },
        });

        // Assert
        await helpers.expectSymmetry({
            context,
            executor: redis.executor(),
            redis: redis.client(),
            realm: realm.id,
            account,
            permissionRealm: realm.id,
            expected: [],
        });
        const created = await suite.transaction((transaction) =>
            transaction.findOneOrFail(Permission, { realm: realm.id, code: "test.created" }),
        );
        expect(await redis.client().hgetall(`projection:permissions:${realm.id}`)).toEqual({
            ...existing,
            [`${created.id}:code`]: created.code,
            [`${created.id}:isRevoked`]: "0",
        });
        expect(await redis.client().hget(`projection:permission-id-by-code:${realm.id}`, created.code)).toBe(created.id);
        expect(await redis.client().hget(`projection:permissions:${realm.id}`, `${created.id}:code`)).toBe(created.code);
    });
});
