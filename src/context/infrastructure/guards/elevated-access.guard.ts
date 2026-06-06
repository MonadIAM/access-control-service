import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { ELEVATED_ACCESS_CACHE_SERVICE } from "~context/infrastructure/services";
import { ELEVATED_ACCESS } from "~common/decorators";
import { Exception } from "~common/exceptions";

@Injectable()
export class ElevatedAccessGuard implements CanActivate {
    private readonly dictionaryPath = "guard.elevated-access";

    public constructor(
        @Inject(ELEVATED_ACCESS_CACHE_SERVICE)
        private readonly elevatedAccessCacheService: InfrastructureServices.ElevatedAccessCache.Contract,
        private readonly reflector: Reflector,
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiresElevatedAccess = this.reflector.getAllAndOverride<boolean>(ELEVATED_ACCESS, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (requiresElevatedAccess) {
            const request = context.switchToHttp().getRequest<Req>();
            const session = request.session?.session;

            if (session) {
                const active = await this.elevatedAccessCacheService.exists({ session });

                if (active) {
                    return true;
                } else {
                    throw Exception.forbidden({ messageKey: `${this.dictionaryPath}.ELEVATED_ACCESS_REQUIRED` });
                }
            } else {
                throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.NOT_AUTHENTICATED` });
            }
        }

        return true;
    }
}
