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

describe("[Projection] - permission/collect", () => {
    const redis = redisSuite(ProjectionScript.PERMISSION_COLLECT);
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
            (await fixture.execute(ProjectionScript.PERMISSION_COLLECT, {
                ...scenario,
                realms: [realm],
                permissions: [scenario.code, "missing"],
                systemRealm: SYSTEM_REALM_ID,
            })) as string,
        );

        // Assert
        expect(result.realms[realm]).toEqual(expected ? { [scenario.code]: "REALM" } : {});
        expect(result.global).toEqual({});
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
            (await fixture.execute(ProjectionScript.PERMISSION_COLLECT, {
                ...scenario,
                permissionRealm: SYSTEM_REALM_ID,
                systemRealm: SYSTEM_REALM_ID,
                realms: [realm],
                permissions: [code],
                globalOnly: true,
            })) as string,
        );

        // Assert
        expect(result.global).toEqual({ [code]: "GLOBAL" });
        expect(result.realms[realm]).toEqual({});
    });
});

describe("[Projection] - permission/collect query symmetry", () => {
    const redis = redisSuite(ProjectionScript.PERMISSION_COLLECT);
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
                    script: ProjectionScript.PERMISSION_COLLECT,
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
            expect(result).toEqual({
                revisions: { [local.id]: {} },
                globalRevision: {},
                realms: { [local.id]: localDeny ? {} : { [permission.code]: "REALM" } },
                global: globalDeny ? {} : { [permission.code]: "GLOBAL" },
            });
            expect(listed.map(({ code }) => code)).toEqual(Object.keys(result.realms[local.id]));
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
                    script: ProjectionScript.PERMISSION_COLLECT,
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
        expect(before).toEqual({
            realms: { [realm.id]: {} },
            global: {},
            revisions: { [realm.id]: {} },
            globalRevision: {},
        });
        expect(after).toEqual({
            realms: { [realm.id]: { [permission.code]: "REALM" } },
            global: {},
            revisions: { [realm.id]: {} },
            globalRevision: {},
        });
        expect(sql.map((item) => item.permission)).toEqual([permission.code]);
        expect(await redis.client().hgetall(`projection:effective:REALM:${realm.id}:${account}:${realm.id}`)).toEqual(
            stored,
        );
    });
});

describe("[Projection] - permission/collect revisions", () => {
    const redis = redisSuite(ProjectionScript.PERMISSION_COLLECT);

    it("[case] - reads effective permissions and their local and global revisions in one query", async () => {
        // Arrange
        const realm = "checkpoint-realm";
        const account = "checkpoint-account";
        await redis.client().hset(`projection:revision:${realm}`, "0", "42");
        await redis.client().hset(`projection:revision:${SYSTEM_REALM_ID}`, "1", "19");
        await redis.client().hset(`projection:effective:REALM:${realm}:${account}:${SYSTEM_REALM_ID}`, "read", "0:0");

        // Act
        const result: Scripts.Permission.Collect.Result = JSON.parse(
            await redis.executor().execute<string>({
                script: ProjectionScript.PERMISSION_COLLECT,
                args: [
                    JSON.stringify({
                        account,
                        realms: [realm],
                        systemRealm: SYSTEM_REALM_ID,
                        permissionRealm: SYSTEM_REALM_ID,
                    }),
                ],
            }),
        );

        // Assert
        expect(result).toEqual({
            realms: { [realm]: { read: "REALM" } },
            global: {},
            revisions: { [realm]: { "0": "42" } },
            globalRevision: { "1": "19" },
        });
    });
    it("[case] - returns empty revisions for realms without checkpoints", async () => {
        // Act
        const result: Scripts.Permission.Collect.Result = JSON.parse(
            await redis.executor().execute<string>({
                script: ProjectionScript.PERMISSION_COLLECT,
                args: [
                    JSON.stringify({
                        account: "account",
                        realms: ["realm"],
                        systemRealm: SYSTEM_REALM_ID,
                        permissionRealm: SYSTEM_REALM_ID,
                    }),
                ],
            }),
        );

        // Assert
        expect(result).toEqual({ global: {}, globalRevision: {}, realms: { realm: {} }, revisions: { realm: {} } });
    });

    it("[case] - keeps revisions isolated across requested realms and excludes unrelated realms", async () => {
        // Arrange
        await redis.client().hset("projection:revision:first", "0", "9007199254740993", "2", "7");
        await redis.client().hset("projection:revision:second", "1", "25");
        await redis.client().hset("projection:revision:other", "0", "99");

        // Act
        const result: Scripts.Permission.Collect.Result = JSON.parse(
            await redis.executor().execute<string>({
                script: ProjectionScript.PERMISSION_COLLECT,
                args: [
                    JSON.stringify({
                        account: "account",
                        realms: ["first", "second"],
                        systemRealm: SYSTEM_REALM_ID,
                        permissionRealm: SYSTEM_REALM_ID,
                    }),
                ],
            }),
        );

        // Assert
        expect(result.revisions).toEqual({ first: { "0": "9007199254740993", "2": "7" }, second: { "1": "25" } });
        expect(result.globalRevision).toEqual({});
    });
});
