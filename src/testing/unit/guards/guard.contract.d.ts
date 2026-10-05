import type { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import type { PermissionCode, PrivilegeScope } from "@monadiam/shared";
import type { Reflector } from "@nestjs/core";

import type { ReauthenticationGuard } from "~context/infrastructure/guards/reauthentication.guard";
import type { PermissionGuard } from "~context/infrastructure/guards/permission.guard";
import type { AuthnGuard } from "~context/infrastructure/guards/authn.guard";

declare global {
    namespace Unit.Guard {
        type Metadata = [PropertyKey, unknown][];

        interface Contract {
            reauthentication: ReauthenticationFactory.Signature;
            permission: PermissionFactory.Signature;
            context: ContextFactory.Signature;
            request: RequestFactory.Signature;
            initialize: Initialize.Signature;
            authn: AuthnFactory.Signature;
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
                classMetadata?: Metadata;
                handlerMetadata?: Metadata;
                request: RequestFactory.Result;
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
                blacklisted?: boolean;
                scope?: string;
            };

            type Result = {
                verifyAccess: Jest.MockedFunction<CommonServices.JWT.VerifyAccess.Signature>;
                exists: Jest.MockedFunction<InfrastructureServices.BlacklistCache.Exists.Signature>;
                guard: AuthnGuard;
            };

            type Signature = (props?: Props) => Result;
        }

        namespace PermissionFactory {
            type CheckPermissions = Jest.MockedFunction<InfrastructureServices.ProjectionCache.CheckPermissions.Signature>;

            type Constructor = new (
                cache: InfrastructureServices.ProjectionCache.PublicContract,
                reflector: Reflector,
            ) => PermissionGuard;

            type Props = {
                matched?: Partial<Record<PermissionCode, PrivilegeScope>>;
            };

            type Result = {
                checkPermissions: CheckPermissions;
                guard: PermissionGuard;
            };

            type Signature = (props?: Props) => Result;
        }

        namespace ReauthenticationFactory {
            type Constructor = new (
                cache: InfrastructureServices.ReauthenticationCache.PublicContract,
                reflector: Reflector,
            ) => ReauthenticationGuard;

            type Props = {
                active?: boolean;
            };

            type Result = {
                exists: Jest.MockedFunction<InfrastructureServices.ReauthenticationCache.Exists.Signature>;
                guard: ReauthenticationGuard;
            };

            type Signature = (props?: Props) => Result;
        }
    }
}
