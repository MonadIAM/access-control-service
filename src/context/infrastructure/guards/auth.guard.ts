import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { jwtVerify } from "jose";

import { GuardException } from "~common/exceptions";
import { IS_PUBLIC_KEY } from "~common/decorators";

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly dictionaryPath = "guard.auth";
    private readonly secret: Uint8Array;

    public constructor(
        private readonly reflector: Reflector,
        private readonly configService: ConfigService,
    ) {
        this.secret = new TextEncoder().encode(this.configService.getOrThrow<string>("JWT_SECRET"));
    }

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        } else {
            const request = context.switchToHttp().getRequest<Req>();
            const token = this.extractToken(request);

            if (token) {
                try {
                    const { payload } = await jwtVerify(token, this.secret);
                    if (payload.sub) {
                        request.actorContext = { account: payload.sub } satisfies ActorContext;
                        return true;
                    } else {
                        throw GuardException.unauthorized(`${this.dictionaryPath}.INVALID_TOKEN`);
                    }
                } catch (error) {
                    if (error instanceof GuardException) {
                        throw error;
                    } else {
                        throw GuardException.unauthorized(`${this.dictionaryPath}.INVALID_TOKEN`);
                    }
                }
            } else {
                throw GuardException.unauthorized(`${this.dictionaryPath}.TOKEN_MISSING`);
            }
        }
    }

    private extractToken(request: Req): Nullable<string> {
        const header = request.headers.authorization;
        if (header) {
            const [scheme, token] = header.split(" ");
            return scheme === "Bearer" && token ? token : null;
        } else {
            return null;
        }
    }
}
