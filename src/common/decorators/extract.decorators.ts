import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { PrivilegeScope } from "@monadiam/shared";

export class Extract {
    public static readonly Meta = createParamDecorator((_: unknown, ctx: ExecutionContext): Extract.Meta => {
        const request = ctx.switchToHttp().getRequest<Req>();
        return {
            userAgent: request.headers["user-agent"] ?? "unknown",
            ip: request.ip,
        };
    });

    public static readonly Session = createParamDecorator(
        (_: unknown, ctx: ExecutionContext): Extract.Session.Public | Extract.Session.Auth => {
            const request = ctx.switchToHttp().getRequest<Req>();
            return request.session;
        },
    );

    public static readonly Permissions = createParamDecorator((scope: Optional<PrivilegeScope>, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<Req>();
        return Object.entries(request.metadata.permissions ?? {})
            .filter(([, matchedScope]) => !scope || matchedScope === scope)
            .map(([permission]) => permission);
    });
}
