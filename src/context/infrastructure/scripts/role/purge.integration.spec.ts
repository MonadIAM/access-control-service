import { beforeEach, describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { MaterializeProjectionFixture } from "~testing/integration/scripts/materialize.fixture";
import { MaterializeProjectionHelpers } from "~testing/integration/scripts/materialize.helpers";
import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { RoleProjectionFixture } from "~testing/integration/scripts/role.fixture";
import { RoleProjectionHelpers } from "~testing/integration/scripts/role.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { redisSuite } from "~testing/integration/containers/redis.suite";

import { ProjectionScript } from "../index";

describe("[Projection] - role/purge", () => {
    const redis = redisSuite(ProjectionScript.ROLE_PURGE);
    let fixture: LifecycleProjectionFixture;

    beforeEach(() => {
        fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());
    });

    it("[case] - purges canonical sources and materialized access", async () => {
        // Arrange
        const scenario = await fixture.createScenario();
        const { realm, role, account } = scenario;
        await fixture.assignRole(scenario);
        await fixture.grantPermission(scenario);
        await fixture.restore();

        // Act
        await fixture.execute(ProjectionScript.ROLE_PURGE, { realm, roles: [role], paths: [] });

        // Assert
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm}:${account}:${realm}`)).toEqual({});
        expect(await redis.client().exists(`projection:role:${realm}:${role}`)).toBe(0);
    });
});

describe("[Projection] - role/purge event symmetry", () => {
    const redis = redisSuite(ProjectionScript.ROLE_PURGE);
    const helpers = new MaterializeProjectionHelpers();
    const suite = postgresSuite({
        repository: (context) => helpers.service(context, redis.executor(), redis.client()),
        fixture: (manager) => new MaterializeProjectionFixture(manager),
    });

    it("[case] - agrees with PostgreSQL after purge", async () => {
        // Arrange
        const fixture = suite.fixtures();
        const state = await fixture.assigned();
        const { realm, account } = state;
        await fixture.setRevoked(state.parent, true);
        await fixture.snapshot(redis.client());
        const context = suite.repository();
        const props = {
            realm: realm.id,
            actor: randomUUID(),
            context: { ip: "127.0.0.1", userAgent: "projection-symmetry" },
            global: true,
            input: { identifiers: [state.parent.id], reason: "Projection symmetry" },
        };

        // Act
        await context.commands.role.purge({ ...props, id: state.parent.id });

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
        expect(await redis.client().exists(`projection:role:${realm.id}:${state.parent.id}`)).toBe(0);
    });
});

describe("[Projection] - role/purge hierarchy symmetry", () => {
    const redis = redisSuite(ProjectionScript.ROLE_PURGE);
    const helpers = new RoleProjectionHelpers();
    const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "role-projection-integration" };
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (manager) => new RoleProjectionFixture(manager, redis.client()),
    });

    describe("[Method] - purge", () => {
        it.each(["child", "grandchild"] as const)(
            "[case] - purges one role and projects remaining depths (%s)",
            async (name) => {
                // Arrange
                const tree = await suite.fixtures().createTree();
                const { root, parent, child, grandchild, detached } = tree.roles;
                const role = tree.roles[name];
                await suite.fixtures().revoke([role]);

                // Act
                await suite.repository().commands.purge({
                    id: role.id,
                    realm: tree.realm.id,
                    actor: randomUUID(),
                    context: CONTEXT,
                    input: { reason: "Remove role" },
                });
                const events = await helpers.consumeProjection({ context: suite.repository(), executor: redis.executor() });
                const remaining = name === "child" ? grandchild : child;
                const expected = [
                    ...[root, parent, remaining, detached].map((item) => helpers.pathKey(item, item, 0)),
                    helpers.pathKey(root, parent, 1),
                    helpers.pathKey(root, detached, 1),
                    helpers.pathKey(parent, remaining, 1),
                    helpers.pathKey(root, remaining, 2),
                ];

                // Assert
                expect(events).toHaveLength(1);
                expect(events[0].actionType).toBe(ProjectionScript.ROLE_PURGE);
                expect(await redis.client().exists(`projection:role:${tree.realm.id}:${role.id}`)).toBe(0);
                const closure = await suite.transaction((transaction) =>
                    helpers.loadClosure({ transaction, redis: redis.client(), realm: tree.realm.id }),
                );
                expect(closure.sql).toEqual(expected.slice().sort());
                expect(closure.projected).toEqual([closure.sql, closure.sql]);
            },
        );
    });

    describe("[Method] - purgeSubtree", () => {
        it.each([1, 130])("[case] - removes subtree assignments and preserves siblings (%s accounts)", async (count) => {
            // Arrange
            const { tree, permission, foreign, foreignRole, accounts } = await suite
                .fixtures()
                .purgeSubtreeScenario({ accounts: count });
            const { root, parent, child, grandchild, detached } = tree.roles;
            const realm = tree.realm.id;
            await suite.fixtures().revoke([parent, child, grandchild]);

            // Act
            await suite.repository().commands.purgeSubtree({
                id: parent.id,
                realm,
                actor: randomUUID(),
                context: CONTEXT,
                input: { reason: "Remove subtree" },
            });
            const events = await helpers.consumeProjection({ context: suite.repository(), executor: redis.executor() });

            // Assert
            expect(events).toHaveLength(1);
            expect(events[0].payload.roles).toEqual(expect.arrayContaining([parent.id, child.id, grandchild.id]));
            await Promise.all(
                [parent, child, grandchild].map(async (role) => {
                    expect(await redis.client().keys(`projection:*${realm}*${role.id}*`)).toEqual([]);
                }),
            );
            expect((await redis.client().smembers(`projection:realm-roles:${realm}`)).sort()).toEqual(
                [root.id, detached.id].sort(),
            );
            expect(
                await redis.client().smembers(`projection:permission-usages:role-assignments:${realm}:${permission.id}`),
            ).toEqual([`${realm}:${detached.id}`]);
            await Promise.all(
                accounts.map(async (account) => {
                    expect(
                        await redis.client().smembers(`projection:account-role-assignments:by-account:${realm}:${account}`),
                    ).toEqual([detached.id]);
                    expect(await redis.client().zscore(`projection:effective-realms:${account}`, realm)).toBe("inf");
                }),
            );
            const closure = await suite.transaction((transaction) =>
                helpers.loadClosure({ transaction, redis: redis.client(), realm }),
            );
            expect(closure.sql).toEqual(
                [
                    helpers.pathKey(root, root, 0),
                    helpers.pathKey(detached, detached, 0),
                    helpers.pathKey(root, detached, 1),
                ].sort(),
            );
            expect(closure.projected).toEqual([closure.sql, closure.sql]);
            const foreignClosure = await suite.transaction((transaction) =>
                helpers.loadClosure({ transaction, redis: redis.client(), realm: foreign.id }),
            );
            expect(foreignClosure.sql).toEqual([helpers.pathKey(foreignRole, foreignRole, 0)]);
            expect(foreignClosure.projected).toEqual([foreignClosure.sql, foreignClosure.sql]);
        });
    });
});
