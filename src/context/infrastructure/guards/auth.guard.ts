import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { GuardException } from "~common/exceptions";
import { IS_PUBLIC_KEY } from "~common/decorators";
import { JWT_SERVICE } from "~common/services";

import { BLACKLIST_CACHE_SERVICE } from "../services";

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
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        try {
            const request = context.switchToHttp().getRequest<Req>();
            const token = this.extractToken(request);

            if (!token) {
                throw GuardException.unauthorized(`${this.dictionaryPath}.TOKEN_MISSING`);
            }

            const payload = await this.jwtService.verify(token);

            if (!payload.sub) {
                throw GuardException.unauthorized(`${this.dictionaryPath}.INVALID_TOKEN`);
            }

            const isBlacklisted = await this.blacklistCacheService.exists({
                sessionId: payload.sid as string,
            });

            if (isBlacklisted) {
                throw GuardException.unauthorized(`${this.dictionaryPath}.SESSION_REVOKED`);
            }

            request.session = {
                session: payload.sid as string,
                account: payload.sub,
            };

            return true;
        } catch (error) {
            if (isPublic) {
                return true;
            } else if (error instanceof GuardException) {
                throw error;
            } else {
                throw GuardException.unauthorized(`${this.dictionaryPath}.INVALID_TOKEN`);
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
