import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { DEFAULT_OAUTH_SCOPE } from "~context/constants";
import { Exception } from "~common/exceptions";
import { JWT_SERVICE } from "~common/services";
import { IS_PUBLIC } from "~common/decorators";

import { BLACKLIST_CACHE_SERVICE } from "../services";

@Injectable()
export class AuthnGuard implements CanActivate {
    private readonly dictionaryPath = "guard.authn";

    public constructor(
        private readonly reflector: Reflector,
        @Inject(JWT_SERVICE)
        private readonly jwtService: CommonServices.JWT.PublicContract,
        @Inject(BLACKLIST_CACHE_SERVICE)
        private readonly blacklistCacheService: InfrastructureServices.BlacklistCache.PublicContract,
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()]);

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Req>();
        const token = this.extractToken(request);

        if (token) {
            const payload = await this.jwtService.verifyAccess({ token });

            const isBlacklisted = await this.blacklistCacheService.exists({ session: payload.sid as string });
            if (isBlacklisted) {
                throw Exception.unauthorized({
                    messageKey: `${this.dictionaryPath}.SESSION_REVOKED`,
                    headers: {
                        "WWW-Authenticate":
                            'Bearer error="invalid_token", error_description="The session associated with this access token has been revoked"',
                    },
                });
            }

            request.session = {
                scope: (payload.scope as string) ?? DEFAULT_OAUTH_SCOPE,
                client: payload.client_id as string,
                realms: payload.realms as string[],
                session: payload.sid as string,
                account: payload.sub as string,
            };

            return true;
        }

        throw Exception.unauthorized({
            messageKey: `${this.dictionaryPath}.TOKEN_MISSING`,
            headers: { "WWW-Authenticate": 'Bearer realm="system"' },
        });
    }

    private extractToken(request: Req): Nullable<string> {
        const header = request.headers.authorization;
        if (header) {
            const match = /^Bearer +([A-Za-z0-9\-._~+/]+=*)$/i.exec(header);
            if (match) {
                return match[1];
            } else {
                throw Exception.badRequest({
                    messageKey: `${this.dictionaryPath}.MALFORMED_AUTHORIZATION`,
                    headers: {
                        "WWW-Authenticate":
                            'Bearer error="invalid_request", error_description="The Authorization header is malformed; expected format: Bearer <token>"',
                    },
                });
            }
        } else {
            return null;
        }
    }
}
