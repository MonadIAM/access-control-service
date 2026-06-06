import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { Exception } from "~common/exceptions";
import { JWT_SERVICE } from "~common/services";
import { IS_PUBLIC } from "~common/decorators";

import { BLACKLIST_CACHE_SERVICE } from "../services/tokens";

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly dictionaryPath = "guard.auth";

    public constructor(
        private readonly reflector: Reflector,
        @Inject(JWT_SERVICE)
        private readonly jwtService: CommonServices.JWT.Contract,
        @Inject(BLACKLIST_CACHE_SERVICE)
        private readonly blacklistCacheService: InfrastructureServices.BlacklistCache.Contract,
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()]);

        try {
            const request = context.switchToHttp().getRequest<Req>();
            const token = this.extractToken(request);

            if (!token) {
                throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.TOKEN_MISSING` });
            }

            const payload = await this.jwtService.verify(token);

            if (!payload.sub) {
                throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_TOKEN` });
            }

            const isBlacklisted = await this.blacklistCacheService.exists({
                session: payload.sid as string,
            });

            if (isBlacklisted) {
                throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.SESSION_REVOKED` });
            }

            request.session = {
                session: payload.sid as string,
                account: payload.sub,
            };

            return true;
        } catch (error) {
            if (isPublic) {
                return true;
            } else if (error instanceof Exception) {
                throw error;
            } else {
                throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_TOKEN` });
            }
        }
    }

    private extractToken(request: Req): Nullable<string> {
        const header = request.headers.authorization;

        if (header) {
            const [scheme, token] = header.split(" ");
            return scheme === "Bearer" && token ? token : null;
        }

        return null;
    }
}
