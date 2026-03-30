import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const ExtractPermissions = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest().metadata.permissions as Optional<string[]>;
});
