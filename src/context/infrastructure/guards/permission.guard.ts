import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
// import { Reflector } from "@nestjs/core";

// import { REQUIRE_PERMISSION_KEY, IS_PUBLIC_KEY } from "~common/decorators";
// import { GuardException } from "~common/exceptions";
// import { PermissionCode } from "~context/enums";

// import { PERMISSION_REPOSITORY } from "../repositories";

@Injectable()
export class PermissionGuard implements CanActivate {
    // private readonly dictionaryPath = "guard.permission";

    // public constructor(
    // @Inject(PERMISSION_REPOSITORY)
    // private readonly permissionRepository: Repositories.Permission.InternalContract,
    // @Inject(PERMISSION_CACHE_SERVICE)
    // private readonly permissionCacheService: InfrastructureServices.PermissionCache.Contract,
    // private readonly reflector: Reflector,
    // ) {}

    public canActivate(_context: ExecutionContext): boolean {
        return true;
        // const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        //     context.getHandler(),
        //     context.getClass(),
        // ]);

        // if (isPublic) {
        //     return true;
        // } else {
        //     const permissions = this.reflector.getAllAndOverride<PermissionCode[]>(REQUIRE_PERMISSION_KEY, [
        //         context.getHandler(),
        //         context.getClass(),
        //     ]);

        //     if (permissions?.length) {
        //         const request = context.switchToHttp().getRequest<Req<{ Querystring: { realm?: string } }>>();
        //         const {
        //             session: { account },
        //             query: { realm },
        //         } = request;

        //         if (account) {
        //             const cached = await this.permissionCacheService.exists({ account });

        //             if (!cached) {
        //                 const rows = await this.permissionRepository.collectEffective({ account });
        //                 const realms = Array.from(new Set(rows.map(({ realm }) => realm)));
        //                 await this.permissionCacheService.populate({ rows, account, realms });
        //             }

        //             const foundPermissions = realm
        //                 ? await this.permissionCacheService.has({ permissions, account, realm })
        //                 : await this.permissionCacheService.hasGlobal({ permissions, account });

        //             if (foundPermissions.length) {
        //                 if (request.metadata?.permissions) {
        //                     request.metadata.permissions = foundPermissions;
        //                 } else {
        //                     request.metadata = { permissions: foundPermissions };
        //                 }
        //                 return true;
        //             } else {
        //                 throw GuardException.forbidden(`${this.dictionaryPath}.INSUFFICIENT_PERMISSIONS`);
        //             }
        //         } else {
        //             throw GuardException.forbidden(`${this.dictionaryPath}.`);
        //         }
        //     } else {
        //         return true;
        //     }
        // }
    }
}
