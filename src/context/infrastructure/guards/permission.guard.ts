import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { REQUIRE_PERMISSION_KEY, IS_PUBLIC_KEY } from "~common/decorators";
import { GuardException } from "~common/exceptions";
import { PermissionCode } from "~context/enums";

import { PERMISSION_REPOSITORY } from "../repositories";
import { PERMISSION_CACHE_SERVICE } from "../services";

@Injectable()
export class PermissionGuard implements CanActivate {
    private readonly dictionaryPath = "guard.permission";

    public constructor(
        @Inject(PERMISSION_REPOSITORY)
        private readonly permissionRepository: Repositories.Permission.Contract,
        @Inject(PERMISSION_CACHE_SERVICE)
        private readonly permissionCacheService: Services.PermissionCache.Contract,
        private readonly reflector: Reflector,
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        } else {
            const permission = this.reflector.getAllAndOverride<PermissionCode>(REQUIRE_PERMISSION_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);

            if (permission) {
                const {
                    query,
                    actorContext: { account },
                } = context.switchToHttp().getRequest<Req<{ Querystring: { realm?: string } }>>();

                const cached = await this.permissionCacheService.exists({ account });

                if (!cached) {
                    const rows = await this.permissionRepository.collectEffectivePermissions({ account });
                    await this.permissionCacheService.populate({ rows, account });
                }

                const allowed = query.realm
                    ? await this.permissionCacheService.has({ permission, account, realm: query.realm })
                    : await this.permissionCacheService.hasGlobal({ permission, account });

                if (allowed) {
                    return true;
                } else {
                    throw GuardException.forbidden(`${this.dictionaryPath}.INSUFFICIENT_PERMISSIONS`);
                }
            } else {
                return true;
            }
        }
    }
}
