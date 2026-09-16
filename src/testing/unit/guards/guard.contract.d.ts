import type { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import type { Reflector } from "@nestjs/core";
import type { jest } from "@jest/globals";

import type { ReauthenticationGuard } from "~context/infrastructure/guards/reauthentication.guard";
import type { PermissionGuard } from "~context/infrastructure/guards/permission.guard";
import type { AuthnGuard } from "~context/infrastructure/guards/authn.guard";

declare global {
    namespace Unit {
        namespace Guard {
            type Metadata = readonly (readonly [PropertyKey, unknown])[];

            interface Contract {
                readonly reauthentication: ReauthenticationFactory.Signature;
                readonly permission: PermissionFactory.Signature;
                readonly context: ContextFactory.Signature;
                readonly request: RequestFactory.Signature;
                readonly initialize: Initialize.Signature;
                readonly authn: AuthnFactory.Signature;
            }

            namespace Initialize {
                type Result = Promise<void>;

                type Signature = () => Result;
            }

            namespace RequestFactory {
                type Result = Req<{ Querystring: { realm?: string } }>;

                type Props = Partial<Pick<Result, "headers" | "metadata" | "query" | "session">>;

                type Signature = (props?: Props) => Result;
            }

            namespace ContextFactory {
                type Props = {
                    readonly classMetadata?: Metadata;
                    readonly handlerMetadata?: Metadata;
                    readonly request: RequestFactory.Result;
                };

                type Result = ExecutionContextHost;

                type Signature = (props: Props) => Result;
            }

            namespace AuthnFactory {
                type Constructor = new (
                    reflector: Reflector,
                    jwt: CommonServices.JWT.PublicContract,
                    blacklist: InfrastructureServices.BlacklistCache.PublicContract,
                ) => AuthnGuard;

                type Props = {
                    readonly blacklisted?: boolean;
                    readonly scope?: string;
                };

                type Result = {
                    readonly verifyAccess: jest.MockedFunction<CommonServices.JWT.VerifyAccess.Signature>;
                    readonly exists: jest.MockedFunction<InfrastructureServices.BlacklistCache.Exists.Signature>;
                    readonly guard: AuthnGuard;
                };

                type Signature = (props?: Props) => Result;
            }

            namespace PermissionFactory {
                type CheckPermissions =
                    jest.MockedFunction<InfrastructureServices.ProjectionCache.CheckPermissions.Signature>;

                type Constructor = new (
                    cache: InfrastructureServices.ProjectionCache.PublicContract,
                    reflector: Reflector,
                ) => PermissionGuard;

                type Props = {
                    readonly matched?: string[];
                };

                type Result = {
                    readonly checkPermissions: CheckPermissions;
                    readonly guard: PermissionGuard;
                };

                type Signature = (props?: Props) => Result;
            }

            namespace ReauthenticationFactory {
                type Constructor = new (
                    cache: InfrastructureServices.ReauthenticationCache.PublicContract,
                    reflector: Reflector,
                ) => ReauthenticationGuard;

                type Props = {
                    readonly active?: boolean;
                };

                type Result = {
                    readonly exists: jest.MockedFunction<InfrastructureServices.ReauthenticationCache.Exists.Signature>;
                    readonly guard: ReauthenticationGuard;
                };

                type Signature = (props?: Props) => Result;
            }
        }
    }
}
