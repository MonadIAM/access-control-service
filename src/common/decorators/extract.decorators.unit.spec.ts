import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { Controller, Get, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { Extract } from "./extract.decorators";

const session: Extract.Session.Auth = {
    account: "account-a",
    session: "session-a",
    client: "client-a",
    realms: ["realm-a"],
    scope: "openid",
};
const permissions = ["role.read", "role.update"];

@Controller("extract")
class ExtractController {
    @Get()
    public read(
        @Extract.Meta() meta: Extract.Meta,
        @Extract.Session() currentSession: Extract.Session.Public,
        @Extract.Permissions() currentPermissions: string[],
    ): { meta: Extract.Meta; session: Extract.Session.Public; permissions: string[] } {
        return { meta, session: currentSession, permissions: currentPermissions };
    }
}

@Module({ controllers: [ExtractController] })
class ExtractTestModule {}

describe("Extract decorators", () => {
    let app: NestFastifyApplication;

    beforeAll(async () => {
        const adapter = new FastifyAdapter();
        adapter.getInstance().addHook("onRequest", (request, _reply, done) => {
            const authenticated = request.headers["x-test-authenticated"] === "true";
            Object.assign(request, {
                session: authenticated ? { ...session, realms: [...session.realms] } : {},
                metadata: authenticated ? { permissions: [...permissions] } : {},
            });
            done();
        });
        app = await NestFactory.create<NestFastifyApplication>(ExtractTestModule, adapter, { logger: false });
        await app.init();
        await adapter.getInstance().ready();
    });

    afterAll(async () => {
        await app?.close();
    });

    describe("request parameters", () => {
        it("passes request metadata, authenticated session and permissions to controller parameters", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/extract",
                remoteAddress: "192.0.2.10",
                headers: { "user-agent": "decorator-contract-test", "x-test-authenticated": "true" },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toEqual({
                meta: { userAgent: "decorator-contract-test", ip: "192.0.2.10" },
                session,
                permissions,
            });
        });

        it("uses unknown for a missing user agent and an empty array for absent permissions", async () => {
            const response = await app.inject({
                headers: { "user-agent": undefined },
                remoteAddress: "192.0.2.11",
                url: "/extract",
                method: "GET",
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toEqual({
                meta: { userAgent: "unknown", ip: "192.0.2.11" },
                session: {},
                permissions: [],
            });
        });

        it("preserves an explicitly empty user agent", async () => {
            const response = await app.inject({ method: "GET", url: "/extract", headers: { "user-agent": "" } });

            expect(response.statusCode).toBe(200);
            expect(response.json().meta.userAgent).toBe("");
        });
    });

    describe("request isolation", () => {
        it("keeps authenticated context isolated from another request", async () => {
            const [authenticated, anonymous] = await Promise.all([
                app.inject({ method: "GET", url: "/extract", headers: { "x-test-authenticated": "true" } }),
                app.inject({ method: "GET", url: "/extract" }),
            ]);

            expect(authenticated.statusCode).toBe(200);
            expect(anonymous.statusCode).toBe(200);
            expect(authenticated.json()).toMatchObject({ session, permissions });
            expect(anonymous.json()).toMatchObject({ session: {}, permissions: [] });
        });
    });
});
