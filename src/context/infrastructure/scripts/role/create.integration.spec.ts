import { beforeEach, describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { RoleProjectionFixture } from "~testing/integration/scripts/role.fixture";
import { RoleProjectionHelpers } from "~testing/integration/scripts/role.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { redisSuite } from "~testing/integration/containers/redis.suite";
import { RoleActorType, RoleArchetype } from "~context/enums";
import { Role } from "~context/domain/entities";

import { ProjectionScript } from "../index";

describe("[Projection] - role/create", () => {
    const redis = redisSuite(ProjectionScript.ROLE_CREATE);
    let fixture: LifecycleProjectionFixture;

    beforeEach(() => {
        fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());
    });

    it("[case] - creates canonical sources and materialized access", async () => {
        // Arrange
        const scenario = await fixture.createScenario();
        const { realm, role, account } = scenario;
        await fixture.assignRole(scenario);
        await fixture.grantPermission(scenario);
        fixture.data.roles = fixture.data.roles.filter((row) => row.id !== scenario.role);
        fixture.data.roleClosures = [];
        await fixture.restore();

        // Act
        await fixture.execute(ProjectionScript.ROLE_CREATE, {
            realm,
            role,
            steps: [{ upsertedPaths: [{ ancestor: { id: role }, descendant: { id: role }, depth: 0 }] }],
        });

        // Assert
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm}:${account}:${realm}`)).toEqual({
            [scenario.code]: "0:0",
        });
        expect(await redis.client().hget(`projection:role:${realm}:${role}`, "isRevoked")).toBe("0");
    });
});

describe("[Projection] - role/create hierarchy symmetry", () => {
    const redis = redisSuite(ProjectionScript.ROLE_CREATE);
    const helpers = new RoleProjectionHelpers();
    const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "role-projection-integration" };
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (manager) => new RoleProjectionFixture(manager, redis.client()),
    });

    describe("[Method] - create", () => {
        it.each([false, true])("[case] - projects SQL hierarchy changes including children (%s)", async (moveChildren) => {
            // Arrange
            const tree = await suite.fixtures().createTree();
            const { root, parent, child, grandchild, detached } = tree.roles;

            // Act
            await suite.repository().commands.create({
                realm: tree.realm.id,
                actor: randomUUID(),
                context: CONTEXT,
                input: {
                    code: "roles.inserted",
                    name: "Inserted",
                    actorType: RoleActorType.HUMAN,
                    archetype: RoleArchetype.COMPOSITE,
                    parent: moveChildren ? root.id : child.id,
                    children: moveChildren ? [parent.id, detached.id] : [],
                },
            });
            const events = await helpers.consumeProjection({ context: suite.repository(), executor: redis.executor() });
            const inserted = await suite.transaction((transaction) =>
                transaction.findOneOrFail(Role, { realm: tree.realm.id, code: "roles.inserted" }),
            );
            const expected = [
                ...Object.values(tree.roles).map((role) => helpers.pathKey(role, role, 0)),
                helpers.pathKey(inserted, inserted, 0),
                helpers.pathKey(root, inserted, moveChildren ? 1 : 3),
                ...(moveChildren ? [] : [helpers.pathKey(parent, inserted, 2), helpers.pathKey(child, inserted, 1)]),
                helpers.pathKey(parent, child, 1),
                helpers.pathKey(child, grandchild, 1),
                helpers.pathKey(parent, grandchild, 2),
                helpers.pathKey(root, parent, moveChildren ? 2 : 1),
                helpers.pathKey(root, child, moveChildren ? 3 : 2),
                helpers.pathKey(root, grandchild, moveChildren ? 4 : 3),
                helpers.pathKey(root, detached, moveChildren ? 2 : 1),
                ...(moveChildren
                    ? [
                          helpers.pathKey(inserted, parent, 1),
                          helpers.pathKey(inserted, child, 2),
                          helpers.pathKey(inserted, grandchild, 3),
                          helpers.pathKey(inserted, detached, 1),
                      ]
                    : []),
            ];

            // Assert
            expect(events).toHaveLength(1);
            expect(events[0].actionType).toBe(ProjectionScript.ROLE_CREATE);
            expect(await redis.client().hget(`projection:role:${tree.realm.id}:${inserted.id}`, "isRevoked")).toBe("0");
            const closure = await suite.transaction((transaction) =>
                helpers.loadClosure({ transaction, redis: redis.client(), realm: tree.realm.id }),
            );
            expect(closure.sql).toEqual(expected.slice().sort());
            expect(closure.projected).toEqual([closure.sql, closure.sql]);
        });
    });
});
