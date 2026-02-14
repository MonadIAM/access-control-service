import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const ExtractContext = createParamDecorator((_: unknown, ctx: ExecutionContext): RequestContext => {
    const request = ctx.switchToHttp().getRequest();
    return {
        userAgent: request.headers["user-agent"] ?? "unknown",
        ip: request.ip,
    };
});
