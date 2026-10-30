import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { isObject, isString } from "class-validator";
import { Reflector } from "@nestjs/core";

import { ReauthenticationMethod } from "~context/enums";
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
        const options = this.reflector.getAllAndOverride<Reauthentication.Options>(REAUTHENTICATION, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (options) {
            const request = context.switchToHttp().getRequest<Req<{ Querystring: { factor?: string } }>>();
            const session = request.session?.session;

            if (session) {
                let active = false;

                if (options.sameFactor) {
                    const { query } = request;
                    const factor =
                        isObject(query) && Object.prototype.hasOwnProperty.call(query, "factor") ? query.factor : undefined;

                    if (isString(factor) && factor.length) {
                        const methods = options.methods?.length ? options.methods : Object.values(ReauthenticationMethod);
                        const proofs = await Promise.all(
                            methods.map((method) => this.reauthenticationCacheService.get({ session, method })),
                        );

                        active = proofs.some(
                            (proof, index) =>
                                proof?.method === methods[index] && "factor" in proof && proof.factor === factor,
                        );
                    }
                } else {
                    active = await this.reauthenticationCacheService.exists({ session, methods: options.methods });
                }

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
