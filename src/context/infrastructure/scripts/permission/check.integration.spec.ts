import { beforeEach, describe, expect, it } from "@jest/globals";
import { SYSTEM_REALM_ID } from "@monadiam/shared";
import { setTimeout } from "node:timers/promises";

import { MaterializeProjectionFixture } from "~testing/integration/scripts/materialize.fixture";
import { MaterializeProjectionHelpers } from "~testing/integration/scripts/materialize.helpers";
import { LifecycleProjectionFixture } from "~testing/integration/scripts/lifecycle.fixture";
import { postgresSuite } from "~testing/integration/containers/postgres.suite";
import { redisSuite } from "~testing/integration/containers/redis.suite";
import { PermissionOverrideEffect } from "~context/enums";

import { ProjectionScript } from "../index";

describe("[Projection] - permission/check", () => {
    const redis = redisSuite(ProjectionScript.PERMISSION_CHECK);
    let fixture: LifecycleProjectionFixture;

    beforeEach(() => {
        fixture = new LifecycleProjectionFixture(redis.client(), redis.executor());
    });

    it.each([
        { interval: "0:0", expected: true },
        { interval: null, expected: false },
        { interval: "past:future", expected: true },
        { interval: "future:0", expected: false },
        { interval: "0:past", expected: false },
    ])("[case] - reads final permission interval $interval", async ({ interval, expected }) => {
        // Arrange
        const scenario = await fixture.createScenario();
        const { realm, account, code } = scenario;
        await redis.client().flushdb();
        if (interval) {
            await redis
                .client()
                .hset(
                    `projection:effective:REALM:${realm}:${account}:${realm}`,
                    code,
                    interval.replace("past", String(Date.now() - 1000)).replace("future", String(Date.now() + 60000)),
                );
        }

        // Act
        const result = JSON.parse(
            (await fixture.execute(ProjectionScript.PERMISSION_CHECK, {
                ...scenario,
                realms: [realm],
                permissions: [scenario.code, "missing"],
                systemRealm: SYSTEM_REALM_ID,
            })) as string,
        );

        // Assert
        expect(result).toEqual(expected ? { [scenario.code]: "REALM" } : {});
    });

    it("[case] - keeps system GLOBAL grants separate from unrelated permission owners", async () => {
        // Arrange
        const scenario = await fixture.createScenario();
        const { account, code, realm } = scenario;
        await redis
            .client()
            .hset(`projection:effective:GLOBAL:${SYSTEM_REALM_ID}:${account}:${SYSTEM_REALM_ID}`, code, "0:0");
        await redis.client().hset(`projection:effective:REALM:${realm}:${account}:${realm}`, code, "0:0");

        // Act
        const result = JSON.parse(
            (await fixture.execute(ProjectionScript.PERMISSION_CHECK, {
                ...scenario,
                permissionRealm: SYSTEM_REALM_ID,
                systemRealm: SYSTEM_REALM_ID,
                realms: [realm],
                permissions: [code],
                globalOnly: true,
            })) as string,
        );

        // Assert
        expect(result).toEqual({ [code]: "GLOBAL" });
    });
    it("[case] - reads every batch and falls back to GLOBAL only for missing local rights", async () => {
        // Arrange
        const scenario = await fixture.createScenario();
        const { realm, account } = scenario;
        const permissions = Array.from({ length: 129 }, (_, index) => `test.permission.${index}`);
        await redis.client().flushdb();
        await redis
            .client()
            .hset(
                `projection:effective:REALM:${realm}:${account}:${SYSTEM_REALM_ID}`,
                Object.fromEntries(permissions.filter((_, index) => index % 2 === 0).map((code) => [code, "0:0"])),
            );
        await redis
            .client()
            .hset(
                `projection:effective:GLOBAL:${SYSTEM_REALM_ID}:${account}:${SYSTEM_REALM_ID}`,
                Object.fromEntries(permissions.map((code) => [code, "0:0"])),
            );

        // Act
        const result = JSON.parse(
            (await fixture.execute(ProjectionScript.PERMISSION_CHECK, {
                ...scenario,
                permissions,
                permissionRealm: SYSTEM_REALM_ID,
                systemRealm: SYSTEM_REALM_ID,
            })) as string,
        );

        // Assert
        expect(result).toEqual(
            Object.fromEntries(permissions.map((code, index) => [code, index % 2 === 0 ? "REALM" : "GLOBAL"])),
        );
    });
});

describe("[Projection] - permission/check query symmetry", () => {
    const redis = redisSuite(ProjectionScript.PERMISSION_CHECK);
    const helpers = new MaterializeProjectionHelpers();
    const suite = postgresSuite({
        repository: (context) => helpers.service(context, redis.executor(), redis.client()),
        fixture: (manager) => new MaterializeProjectionFixture(manager),
    });

    it.each([
        { localDeny: false, globalDeny: false },
        { localDeny: true, globalDeny: false },
        { localDeny: false, globalDeny: true },
        { localDeny: true, globalDeny: true },
    ])(
        "[case] - agrees with PostgreSQL for local deny=$localDeny and global deny=$globalDeny",
        async ({ localDeny, globalDeny }) => {
            // Arrange
            const fixture = suite.fixtures();
            const { local, permission, account } = await fixture.globalScenario(localDeny, globalDeny);
            await fixture.snapshot(redis.client());

            // Act
            const result = JSON.parse(
                await redis.executor().execute<string>({
                    script: ProjectionScript.PERMISSION_CHECK,
                    args: [
                        JSON.stringify({
                            realm: local.id,
                            realms: [local.id],
                            account,
                            permissionRealm: SYSTEM_REALM_ID,
                            systemRealm: SYSTEM_REALM_ID,
                            permissions: [permission.code],
                        }),
                    ],
                }),
            );
            const sql = await suite
                .repository()
                .permissions.collectEffective({ account, permissionRealm: SYSTEM_REALM_ID });
            const [listed] = await suite.repository().permissions.findEffective({
                where: { realm: local.id, account },
                pagination: { currentPage: 1, elementsPerPage: 10 },
                filters: {},
                sort: {},
            });

            // Assert
            const expected = localDeny
                ? globalDeny
                    ? {}
                    : { [permission.code]: "GLOBAL" }
                : { [permission.code]: "REALM" };
            expect(result).toEqual(expected);
            expect(listed.map(({ code }) => code)).toEqual(localDeny ? [] : [permission.code]);
            expect(sql.filter(({ realm }) => realm === local.id).map(({ permission }) => permission)).toEqual(
                localDeny ? [] : [permission.code],
            );
            expect(sql.filter(({ scope }) => scope === "GLOBAL").map(({ permission }) => permission)).toEqual(
                globalDeny ? [] : [permission.code],
            );
        },
    );

    it("[case] - exposes a prepared permission after DENY expires without another mutation", async () => {
        // Arrange
        const fixture = suite.fixtures();
        const { realm, permission, account, deadline } = await fixture.expiring(PermissionOverrideEffect.DENY);
        await fixture.snapshot(redis.client());
        const payload = {
            realm: realm.id,
            realms: [realm.id],
            account,
            permissionRealm: realm.id,
            systemRealm: SYSTEM_REALM_ID,
            permissions: [permission.code],
        };
        const read = async (): Promise<unknown> =>
            JSON.parse(
                await redis.executor().execute<string>({
                    script: ProjectionScript.PERMISSION_CHECK,
                    args: [JSON.stringify(payload)],
                }),
            );
        const before = await read();
        const stored = await redis.client().hgetall(`projection:effective:REALM:${realm.id}:${account}:${realm.id}`);

        // Act
        await setTimeout(Math.max(0, deadline.getTime() - Date.now()) + 20);
        const after = await read();
        const sql = await suite.repository().permissions.collectEffective({ account, permissionRealm: realm.id });

        // Assert
        expect(before).toEqual({});
        expect(after).toEqual({ [permission.code]: "REALM" });
        expect(sql.map((item) => item.permission)).toEqual([permission.code]);
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm.id}:${account}:${realm.id}`)).toEqual(
            stored,
        );
    });
});
