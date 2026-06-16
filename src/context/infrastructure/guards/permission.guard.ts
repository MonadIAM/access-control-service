import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { PROJECTION_CACHE_SERVICE } from "~context/infrastructure/services/tokens";
import { SystemRealm } from "~infrastructure/datasets/realm.dataset";
import { REQUIRE_PERMISSION, IS_PUBLIC } from "~common/decorators";
import { Exception } from "~common/exceptions";
import { PermissionCode } from "~context/enums";

@Injectable()
export class PermissionGuard implements CanActivate {
    private readonly dictionaryPath = "guard.permission";

    public constructor(
        @Inject(PROJECTION_CACHE_SERVICE)
        private readonly projectionCacheService: InfrastructureServices.ProjectionCache.Contract,
        private readonly reflector: Reflector,
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()]);

        if (isPublic) {
            return true;
        }

        const permissions = this.reflector.getAllAndOverride<PermissionCode[]>(REQUIRE_PERMISSION, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!permissions?.length) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Req<{ Querystring: { realm?: string } }>>();
        const realm = request.query?.realm ?? SystemRealm.id;
        const account = request.session?.account;

        if (!account) {
            throw Exception.forbidden({ messageKey: `${this.dictionaryPath}.ACCOUNT_REQUIRED` });
        }

        const matched = await this.projectionCacheService.checkPermissions({
            permissions,
            account,
            realm,
        });

        if (!matched.length) {
            throw Exception.forbidden({ messageKey: `${this.dictionaryPath}.INSUFFICIENT_PERMISSIONS` });
        }

        request.metadata = {
            ...request.metadata,
            permissions: matched,
        };

        return true;
    }
}
