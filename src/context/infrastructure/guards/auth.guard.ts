import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";

import { GuardException } from "~common/exceptions";
import { JWT_SERVICE } from "~common/services";

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly dictionaryPath = "guard.auth";

    public constructor(
        @Inject(JWT_SERVICE)
        private readonly jwtService: CommonServices.JWT.Contract,
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Req>();
        const token = this.extractToken(request);

        if (!token) {
            throw GuardException.unauthorized(`${this.dictionaryPath}.TOKEN_MISSING`);
        }

        try {
            const payload = await this.jwtService.verify(token);
            if (!payload.sub) {
                throw GuardException.unauthorized(`${this.dictionaryPath}.INVALID_TOKEN`);
            }

            request.session = {
                session: payload.sid as string,
                account: payload.sub,
            };

            return true;
        } catch (error) {
            if (error instanceof GuardException) {
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
