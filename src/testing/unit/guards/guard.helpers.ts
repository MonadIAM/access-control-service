import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import { Reflector } from "@nestjs/core";
import { jest } from "@jest/globals";

import { REAUTHENTICATION, REQUIRE_GLOBAL_PERMISSION, REQUIRE_PERMISSION, IS_PUBLIC } from "~common/decorators/tokens";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

jest.unstable_mockModule("~common/decorators", () => ({
    REQUIRE_GLOBAL_PERMISSION,
    REQUIRE_PERMISSION,
    REAUTHENTICATION,
    IS_PUBLIC,
}));

jest.unstable_mockModule("~context/infrastructure/services", () => ({
    REAUTHENTICATION_CACHE_SERVICE: Symbol("REAUTHENTICATION_CACHE_SERVICE"),
    PROJECTION_CACHE_SERVICE: Symbol("PROJECTION_CACHE_SERVICE"),
    BLACKLIST_CACHE_SERVICE: Symbol("BLACKLIST_CACHE_SERVICE"),
}));

export class GuardUnitHelpers extends DomainServiceCoreUnitHelpers implements Unit.Guard.Contract {
    declare private ReauthenticationGuard: Unit.Guard.ReauthenticationFactory.Constructor;
    declare private PermissionGuard: Unit.Guard.PermissionFactory.Constructor;
    declare private AuthnGuard: Unit.Guard.AuthnFactory.Constructor;

    public async initialize(): Unit.Guard.Initialize.Result {
        const reauthenticationPath = "~context/infrastructure/guards/reauthentication.guard";
        const permissionPath = "~context/infrastructure/guards/permission.guard";
        const authnPath = "~context/infrastructure/guards/authn.guard";

        const reauthentication = await import(reauthenticationPath);
        const permission = await import(permissionPath);
        const authn = await import(authnPath);

        this.ReauthenticationGuard = reauthentication.ReauthenticationGuard;
        this.PermissionGuard = permission.PermissionGuard;
        this.AuthnGuard = authn.AuthnGuard;
    }

    public request(props: Unit.Guard.RequestFactory.Props = {}): Unit.Guard.RequestFactory.Result {
        return this.contract<Unit.Guard.RequestFactory.Result>({
            metadata: {},
            headers: {},
            session: {},
            query: {},
            ...props,
        });
    }

    public context(props: Unit.Guard.ContextFactory.Props): Unit.Guard.ContextFactory.Result {
        const handler = (): void => undefined;
        class Controller {}

        for (const [key, value] of props.handlerMetadata ?? []) {
            Reflect.defineMetadata(key, value, handler);
        }
        for (const [key, value] of props.classMetadata ?? []) {
            Reflect.defineMetadata(key, value, Controller);
        }

        return new ExecutionContextHost([props.request], Controller, handler);
    }

    public authn(props: Unit.Guard.AuthnFactory.Props = {}): Unit.Guard.AuthnFactory.Result {
        const verifyAccess = jest.fn<CommonServices.JWT.VerifyAccess.Signature>(() =>
            Promise.resolve({
                client_id: "00000000-0000-4000-8000-000000000003",
                realms: ["00000000-0000-4000-8000-000000000004"],
                scope: props.scope,
                sid: "00000000-0000-4000-8000-000000000001",
                sub: "00000000-0000-4000-8000-000000000002",
            }),
        );
        const exists = jest.fn<InfrastructureServices.BlacklistCache.Exists.Signature>(() =>
            Promise.resolve(props.blacklisted ?? false),
        );
        const blacklist = this.contract<InfrastructureServices.BlacklistCache.PublicContract>({
            set: jest.fn(() => Promise.resolve()),
            exists,
        });
        const jwt = this.contract<CommonServices.JWT.PublicContract>({ verifyAccess });

        return {
            guard: new this.AuthnGuard(new Reflector(), jwt, blacklist),
            verifyAccess,
            exists,
        };
    }

    public permission(props: Unit.Guard.PermissionFactory.Props = {}): Unit.Guard.PermissionFactory.Result {
        const checkPermissions = jest.fn<InfrastructureServices.ProjectionCache.CheckPermissions.Signature>(() =>
            Promise.resolve(props.matched ?? []),
        );
        const cache = this.contract<InfrastructureServices.ProjectionCache.PublicContract>({
            validateAssignments: jest.fn(() => Promise.resolve({ missing: [], groups: [] })),
            collectPermissions: jest.fn(() => Promise.resolve({})),
            collectRealms: jest.fn(() => Promise.resolve([])),
            checkRealm: jest.fn(() => Promise.resolve(false)),
            checkPermissions,
        });

        return { guard: new this.PermissionGuard(cache, new Reflector()), checkPermissions };
    }

    public reauthentication(
        props: Unit.Guard.ReauthenticationFactory.Props = {},
    ): Unit.Guard.ReauthenticationFactory.Result {
        const exists = jest.fn<InfrastructureServices.ReauthenticationCache.Exists.Signature>(() =>
            Promise.resolve(props.active ?? false),
        );
        const cache = this.contract<InfrastructureServices.ReauthenticationCache.PublicContract>({
            delete: jest.fn(() => Promise.resolve()),
            set: jest.fn(() => Promise.resolve()),
            exists,
        });

        return { guard: new this.ReauthenticationGuard(cache, new Reflector()), exists };
    }
}
