import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export class Tokens {
    public static readonly Access = createParamDecorator((_: unknown, ctx: ExecutionContext): Optional<string> => {
        const header = ctx.switchToHttp().getRequest<Req>().headers.authorization;

        if (header) {
            const [scheme, token] = header.split(" ");
            return scheme === "Bearer" && token ? token : undefined;
        } else {
            return undefined;
        }
    });

    public static readonly Refresh = createParamDecorator((_: unknown, ctx: ExecutionContext): Optional<string> => {
        return ctx.switchToHttp().getRequest<Req>().cookies["refresh_token"];
    });

    public static readonly Pending = createParamDecorator((_: unknown, ctx: ExecutionContext): Optional<string> => {
        return ctx.switchToHttp().getRequest<Req>().cookies["pending_token"];
    });
}
