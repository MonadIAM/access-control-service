import { beforeEach, describe, expect, it } from "@jest/globals";
import { randomUUID } from "node:crypto";

import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { redisSuite } from "~testing/integration/containers/redis.suite";

describe("[Projection] - shared/materialize", () => {
    const redis = redisSuite();
    let fixture: LifecycleProjectionFixture;

    beforeEach(() => {
        fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());
    });

    it.each([false, true])("[case] - materializes inherited rights with ancestor revoked=%s", async (isRevoked) => {
        // Arrange
        const scenario = await fixture.createScenario();
        await fixture.grantPermission(scenario);
        const child = randomUUID();
        fixture.data.roles.push({ id: child, realm_id: scenario.realm, is_revoked: false });
        fixture.data.roleClosures.push(
            { realm_id: scenario.realm, ancestor_id: child, descendant_id: child, depth: 0 },
            { realm_id: scenario.realm, ancestor_id: scenario.role, descendant_id: child, depth: 1 },
        );
        fixture.data.roles[0].is_revoked = isRevoked;
        await fixture.assignRole({ ...scenario, role: child });
        const { realm, account } = scenario;
        await redis.client().unlink(`projection:effective:REALM:${realm}:${account}:${realm}`);

        // Act
        await fixture.probe({ action: "materialize", targets: { [realm]: { [account]: true } } }, "seed");

        // Assert
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm}:${account}:${realm}`)).toEqual(
            isRevoked ? {} : { [scenario.code]: "0:0" },
        );
    });

    it.each(["account-role-assignment/update", "permission-override/update", "role-permission-assignment/update"])(
        "[case] - limits targets for %s to affected sources",
        async (script) => {
            // Arrange
            const scenario = await fixture.createScenario();
            await fixture.assignRole(scenario);
            const unrelated = { ...scenario, role: randomUUID(), account: randomUUID(), assignment: randomUUID() };
            fixture.data.roles.push({ id: unrelated.role, realm_id: unrelated.realm, is_revoked: false });
            await fixture.assignRole(unrelated);

            // Act
            const result = await fixture.probe(
                { action: "targets", script, input: { realm: scenario.realm, items: [scenario] } },
                "seed",
            );

            // Assert
            expect(JSON.parse(result as string)).toEqual({ [scenario.realm]: { [scenario.account]: true } });
        },
    );

    it.each(["realm", "assigned role", "ancestor", "permission", "assignment", "grant"])(
        "[case] - removes stale inherited access after revoking %s",
        async (entity) => {
            // Arrange
            const scenario = await fixture.inheritedScenario();
            const { realm, role, parent, account, permission } = scenario;
            const keys: Record<string, string> = {
                realm: `projection:realm:${realm}`,
                "assigned role": `projection:role:${realm}:${role}`,
                ancestor: `projection:role:${realm}:${parent}`,
                permission: `projection:permissions:${realm}`,
                assignment: `projection:account-role-assignment:${realm}:${account}:${role}`,
                grant: `projection:role-permission-assignments:${realm}:${parent}`,
            };
            const field = ["permission", "grant"].includes(entity) ? `${permission}:isRevoked` : "isRevoked";
            await redis.client().hset(keys[entity], field, "1");
            expect(
                await redis.client().hget(`projection:effective:REALM:${realm}:${account}:${realm}`, scenario.code),
            ).toBe("0:0");

            // Act
            await fixture.probe({ action: "materialize", targets: { [realm]: { [account]: true } } }, "seed");

            // Assert
            expect(await redis.client().hgetall(`projection:effective:REALM:${realm}:${account}:${realm}`)).toEqual({});
            expect(await redis.client().zscore(`projection:effective-realms:${account}`, realm)).toBe(
                ["realm", "assigned role", "assignment"].includes(entity) ? null : "inf",
            );
        },
    );

    it("[case] - keeps the longest deadline among independent inherited sources", async () => {
        // Arrange
        const scenario = await fixture.inheritedScenario();
        const { realm, account, parent } = scenario;
        const shorter = Date.now() + 60000;
        const longer = shorter + 60000;
        fixture.data.accountRoleAssignments[0].expires_at = shorter;
        await fixture.assignRole({ ...scenario, role: parent, assignment: randomUUID() });
        fixture.data.accountRoleAssignments[1].expires_at = longer;
        await fixture.restore();
        await redis
            .client()
            .unlink(`projection:effective:REALM:${realm}:${account}:${realm}`, `projection:effective-realms:${account}`);

        // Act
        await fixture.probe({ action: "materialize", targets: { [realm]: { [account]: true } } }, "seed");

        // Assert
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm}:${account}:${realm}`)).toEqual({
            [scenario.code]: `0:${longer}`,
        });
        expect(await redis.client().zscore(`projection:effective-realms:${account}`, realm)).toBe(String(longer));
    });

    it.each(["ALLOW", "DENY"])("[case] - keeps %s override deadlines independent of membership", async (effect) => {
        // Arrange
        const scenario = await fixture.createScenario();
        await fixture.overridePermission(scenario, effect);
        const deadline = Date.now() + 60000;
        fixture.data.permissionOverrides[0].expires_at = deadline;
        await fixture.restore();
        const { realm, account } = scenario;
        await redis.client().unlink(`projection:effective:REALM:${realm}:${account}:${realm}`);

        // Act
        await fixture.probe({ action: "materialize", targets: { [realm]: { [account]: true } } }, "seed");

        // Assert
        expect(await redis.client().hget(`projection:effective:REALM:${realm}:${account}:${realm}`, scenario.code)).toBe(
            effect === "ALLOW" ? `0:${deadline}` : null,
        );
        expect(await redis.client().zscore(`projection:effective-realms:${account}`, realm)).toBeNull();
    });

    it.each([
        { effect: "DENY", grant: 120000, override: 60000, expected: "delayed" },
        { effect: "DENY", grant: 60000, override: 120000, expected: "absent" },
        { effect: "DENY", grant: 0, override: 0, expected: "absent" },
        { effect: "DENY", grant: 0, override: 60000, expected: "delayed" },
        { effect: "DENY", grant: 60000, override: -1000, expected: "grant" },
        { effect: "ALLOW", grant: 60000, override: 120000, expected: "override" },
        { effect: "ALLOW", grant: 120000, override: 60000, expected: "grant" },
        { effect: "ALLOW", grant: -1000, override: 60000, expected: "override" },
    ])("[case] - resolves $effect with grant=$grant and override=$override in the command", async (item) => {
        // Arrange
        const { scenario, grantedUntil, overriddenUntil } = await fixture.temporalScenario(
            item.effect,
            item.grant,
            item.override,
        );
        const { realm, account, code } = scenario;
        const expected = {
            delayed: `${overriddenUntil}:${grantedUntil}`,
            absent: null,
            grant: `0:${grantedUntil}`,
            override: `0:${overriddenUntil}`,
        }[item.expected];

        // Act
        await fixture.probe({ action: "materialize", targets: { [realm]: { [account]: true } } }, "seed");

        // Assert
        expect(await redis.client().hget(`projection:effective:REALM:${realm}:${account}:${realm}`, code)).toBe(expected);
    });

    it("[case] - writes all permissions across HSET batch boundaries", async () => {
        // Arrange
        const { realm, account } = await fixture.permissionSet(129);
        await redis.client().unlink(`projection:effective:REALM:${realm}:${account}:${realm}`);

        // Act
        await fixture.probe({ action: "materialize", targets: { [realm]: { [account]: true } } }, "seed");

        // Assert
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm}:${account}:${realm}`)).toEqual(
            Object.fromEntries(fixture.data.permissions.map(({ code }) => [code, "0:0"])),
        );
    });

    it.each(["role/update", "role/purge", "role-closure/update"])(
        "[case] - limits %s to holders of affected descendants",
        async (script) => {
            // Arrange
            const scenario = await fixture.inheritedScenario();
            const unrelated = { ...scenario, role: randomUUID(), account: randomUUID(), assignment: randomUUID() };
            fixture.data.roles.push({ id: unrelated.role, realm_id: unrelated.realm, is_revoked: false });
            await fixture.assignRole(unrelated);
            const path = { ancestor: { id: scenario.parent }, descendant: { id: scenario.role }, depth: 1 };

            // Act
            const result = await fixture.probe(
                {
                    action: "targets",
                    script,
                    input:
                        script === "role-closure/update"
                            ? { realm: scenario.realm, steps: [{ removedPaths: [path], upsertedPaths: [path] }] }
                            : { realm: scenario.realm, roles: [scenario.parent] },
                },
                "seed",
            );

            // Assert
            expect(JSON.parse(result as string)).toEqual({ [scenario.realm]: { [scenario.account]: true } });
        },
    );

    it("[case] - retains revoked and expired accounts as realm mutation targets", async () => {
        // Arrange
        const scenario = await fixture.inheritedScenario();
        const expired = { ...scenario, account: randomUUID(), assignment: randomUUID() };
        fixture.data.accountRoleAssignments[0].is_revoked = true;
        await fixture.assignRole(expired);
        fixture.data.accountRoleAssignments[1].expires_at = Date.now() - 1000;
        await fixture.restore();

        // Act
        const result = await fixture.probe(
            {
                action: "targets",
                script: "realm/update",
                input: { realm: scenario.realm, isRevoked: false },
            },
            "seed",
        );

        // Assert
        expect(JSON.parse(result as string)).toEqual({
            [scenario.realm]: { [scenario.account]: true, [expired.account]: true },
        });
    });

    it("[case] - excludes missing and revoked records from batched permission reads", async () => {
        // Arrange
        const { realm, account } = await fixture.permissionSet(129);
        const revoked = fixture.data.permissions[0];
        const missing = fixture.data.permissions[64];
        const revokedGrant = fixture.data.rolePermissionAssignments[128];
        revoked.is_revoked = true;
        revokedGrant.is_revoked = true;
        fixture.data.permissions = fixture.data.permissions.filter(({ id }) => id !== missing.id);
        await fixture.restore();
        await redis.client().unlink(`projection:effective:REALM:${realm}:${account}:${realm}`);

        // Act
        await fixture.probe({ action: "materialize", targets: { [realm]: { [account]: true } } }, "seed");

        // Assert
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm}:${account}:${realm}`)).toEqual(
            Object.fromEntries(
                fixture.data.permissions
                    .filter(({ id }) => id !== revoked.id && id !== revokedGrant.permission_id)
                    .map(({ code }) => [code, "0:0"]),
            ),
        );
    });
});
