import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { REQUIRE_GLOBAL_PERMISSION, REQUIRE_PERMISSION, IS_PUBLIC } from "~common/decorators";
import { SYSTEM_REALM_ID } from "~context/constants";
import { PermissionCode } from "~context/enums";
import { Exception } from "~common/exceptions";

import { PROJECTION_CACHE_SERVICE } from "../services";

@Injectable()
export class PermissionGuard implements CanActivate {
    private readonly dictionaryPath = "guard.permission";

    public constructor(
        @Inject(PROJECTION_CACHE_SERVICE)
        private readonly projectionCacheService: InfrastructureServices.ProjectionCache.PublicContract,
        private readonly reflector: Reflector,
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()]);

        if (isPublic) {
            return true;
        }

        const globalPermissions = this.reflector.getAllAndOverride<PermissionCode[]>(REQUIRE_GLOBAL_PERMISSION, [
            context.getHandler(),
            context.getClass(),
        ]);

        const permissions =
            globalPermissions ??
            this.reflector.getAllAndOverride<PermissionCode[]>(REQUIRE_PERMISSION, [
                context.getHandler(),
                context.getClass(),
            ]);

        if (!permissions?.length) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Req<{ Querystring: { realm?: string } }>>();
        const realm = globalPermissions ? SYSTEM_REALM_ID : (request.query?.realm ?? SYSTEM_REALM_ID);
        const account = request.session?.account;
        const realms = request.session?.realms;

        if (!account) {
            throw Exception.forbidden({ messageKey: `${this.dictionaryPath}.ACCOUNT_REQUIRED` });
        }

        if (!realm) {
            throw Exception.forbidden({ messageKey: `${this.dictionaryPath}.REALM_REQUIRED` });
        }

        const matched = await this.projectionCacheService.checkPermissions({
            globalOnly: Boolean(globalPermissions) || !realms?.includes(realm),
            permissions,
            account,
            realm,
        });

        if (!Object.keys(matched).length) {
            throw Exception.forbidden({ messageKey: `${this.dictionaryPath}.INSUFFICIENT_PERMISSIONS` });
        }

        request.metadata = {
            ...request.metadata,
            permissions: matched,
        };

        return true;
    }
}
