import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { PERMISSION_CACHE_SERVICE } from "~context/infrastructure/services/tokens";
import { SystemRealm } from "~infrastructure/datasets/system/realm.dataset";
import { REQUIRE_PERMISSION_KEY, IS_PUBLIC_KEY } from "~common/decorators";
import { GuardException } from "~common/exceptions";
import { PermissionCode } from "~context/enums";

@Injectable()
export class PermissionGuard implements CanActivate {
    private readonly dictionaryPath = "guard.permission";

    public constructor(
        @Inject(PERMISSION_CACHE_SERVICE)
        private readonly permissionCacheService: InfrastructureServices.PermissionCache.Contract,
        private readonly reflector: Reflector,
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const permissions = this.reflector.getAllAndOverride<PermissionCode[]>(REQUIRE_PERMISSION_KEY, [
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
            throw GuardException.forbidden(`${this.dictionaryPath}.ACCOUNT_REQUIRED`);
        }

        const allowed = await this.permissionCacheService.check({
            permissions,
            account,
            realm,
        });

        if (!allowed) {
            throw GuardException.forbidden(`${this.dictionaryPath}.INSUFFICIENT_PERMISSIONS`);
        }

        request.metadata = {
            ...request.metadata,
            permissions,
        };

        return true;
    }
}
