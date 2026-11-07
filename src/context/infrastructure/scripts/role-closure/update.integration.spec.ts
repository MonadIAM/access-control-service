import { describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { MaterializeProjectionHelpers } from "~testing/integration/scripts/materialize.helpers";
import { RoleProjectionFixture } from "~testing/integration/scripts/role.fixture";
import { RoleProjectionHelpers } from "~testing/integration/scripts/role.helpers";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { redisSuite } from "~testing/integration/containers/redis.suite";
import { MoveMode } from "~context/enums";

import { ProjectionScript } from "../index";

describe("[Projection] - role-closure/update hierarchy symmetry", () => {
    const redis = redisSuite(ProjectionScript.ROLE_CLOSURE_UPDATE);
    const helpers = new RoleProjectionHelpers();
    const CONTEXT: Extract.Meta = { ip: "127.0.0.1", userAgent: "role-projection-integration" };
    const suite = postgresSuite({
        repository: (context) => helpers.service(context),
        fixture: (manager) => new RoleProjectionFixture(manager, redis.client()),
    });

    describe("[Method] - move", () => {
        it.each([
            { mode: MoveMode.SUBTREE, formerChild: false },
            { mode: MoveMode.PARALLEL, formerChild: false },
            { mode: MoveMode.LINEAR, formerChild: false },
            { mode: MoveMode.PARALLEL, formerChild: true },
            { mode: MoveMode.LINEAR, formerChild: true },
        ])("[case] - projects ordered move steps ($mode, former child: $formerChild)", async ({ mode, formerChild }) => {
            // Arrange
            const tree = await suite.fixtures().createTree();
            const { root, parent, child, grandchild, detached } = tree.roles;
            const targetParent = formerChild ? child : detached;

            // Act
            await suite.repository().commands.move({
                realm: tree.realm.id,
                actor: randomUUID(),
                context: CONTEXT,
                input: { target: parent.id, targetParent: targetParent.id, mode },
            });
            const events = await helpers.consumeProjection({ context: suite.repository(), executor: redis.executor() });
            const expected = [
                ...Object.values(tree.roles).map((role) => helpers.pathKey(role, role, 0)),
                helpers.pathKey(root, detached, 1),
                helpers.pathKey(targetParent, parent, 1),
                helpers.pathKey(root, parent, 2),
            ];
            if (mode === MoveMode.SUBTREE) {
                expected.push(
                    helpers.pathKey(parent, child, 1),
                    helpers.pathKey(parent, grandchild, 2),
                    helpers.pathKey(child, grandchild, 1),
                    helpers.pathKey(detached, child, 2),
                    helpers.pathKey(detached, grandchild, 3),
                    helpers.pathKey(root, child, 3),
                    helpers.pathKey(root, grandchild, 4),
                );
            } else if (formerChild && mode === MoveMode.LINEAR) {
                expected.push(
                    helpers.pathKey(root, child, 1),
                    helpers.pathKey(parent, grandchild, 1),
                    helpers.pathKey(child, grandchild, 2),
                    helpers.pathKey(root, grandchild, 3),
                );
            } else {
                expected.push(
                    helpers.pathKey(root, child, 1),
                    helpers.pathKey(child, grandchild, 1),
                    helpers.pathKey(root, grandchild, 2),
                );
            }

            // Assert
            expect(events).toHaveLength(1);
            expect(events[0].actionType).toBe(ProjectionScript.ROLE_CLOSURE_UPDATE);
            const closure = await suite.transaction((transaction) =>
                helpers.loadClosure({ transaction, redis: redis.client(), realm: tree.realm.id }),
            );
            expect(closure.sql).toEqual(expected.slice().sort());
            expect(closure.projected).toEqual([closure.sql, closure.sql]);
        });
    });
});

describe("[Projection] - role-closure/update effective permission symmetry", () => {
    const redis = redisSuite(ProjectionScript.ROLE_CLOSURE_UPDATE);
    const helpers = new MaterializeProjectionHelpers();
    const suite = postgresSuite({
        repository: (context) => helpers.service(context, redis.executor(), redis.client()),
        fixture: (manager) => new RoleProjectionFixture(manager, redis.client()),
    });

    it.each([MoveMode.SUBTREE, MoveMode.PARALLEL, MoveMode.LINEAR])(
        "[case] - replaces inherited grants after %s move",
        async (mode) => {
            // Arrange
            const { tree, account, previous, next } = await suite.fixtures().moveScenario();
            const { realm, roles } = tree;
            const context = suite.repository();
            expect(await redis.client().hgetall(`projection:effective:REALM:${realm.id}:${account}:${realm.id}`)).toEqual({
                [previous.code]: "0:0",
            });

            // Act
            await context.commands.role.move({
                realm: realm.id,
                actor: randomUUID(),
                context: { ip: "127.0.0.1", userAgent: "projection-move" },
                input: { target: roles.parent.id, targetParent: roles.detached.id, mode },
            });

            // Assert
            await helpers.expectSymmetry({
                context,
                executor: redis.executor(),
                redis: redis.client(),
                realm: realm.id,
                account,
                permissionRealm: realm.id,
                expected: mode === MoveMode.SUBTREE ? [previous.code, next.code] : [],
            });
        },
    );
});
