import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { REAUTHENTICATION } from "~common/decorators";
import { Exception } from "~common/exceptions";

import { REAUTHENTICATION_CACHE_SERVICE } from "../services";

@Injectable()
export class ReauthenticationGuard implements CanActivate {
    private readonly dictionaryPath = "guard.reauthentication";

    public constructor(
        @Inject(REAUTHENTICATION_CACHE_SERVICE)
        private readonly reauthenticationCacheService: InfrastructureServices.ReauthenticationCache.PublicContract,
        private readonly reflector: Reflector,
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiresReauthentication = this.reflector.getAllAndOverride<boolean>(REAUTHENTICATION, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (requiresReauthentication) {
            const request = context.switchToHttp().getRequest<Req>();
            const session = request.session?.session;

            if (session) {
                const active = await this.reauthenticationCacheService.exists({ session });

                if (active) {
                    return true;
                } else {
                    throw Exception.forbidden({ messageKey: `${this.dictionaryPath}.REAUTHENTICATION_REQUIRED` });
                }
            } else {
                throw Exception.unauthorized({
                    messageKey: `${this.dictionaryPath}.NOT_AUTHENTICATED`,
                    headers: { "WWW-Authenticate": 'Bearer realm="system"' },
                });
            }
        }

        return true;
    }
}
