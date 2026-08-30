import { Controller, Inject } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";

import { PROJECTION_CACHE_SERVICE } from "~context/infrastructure/services";

@Controller()
export class AccessControlController {
    public constructor(
        @Inject(PROJECTION_CACHE_SERVICE)
        private readonly projectionCacheService: InfrastructureServices.ProjectionCache.PublicContract,
    ) {}

    @GrpcMethod("AccessControlService", "ListEffectivePrivileges")
    public async listEffectivePrivileges(
        props: GRPC.AccessControl.ListEffectivePrivileges.Request,
    ): Promise<GRPC.AccessControl.ListEffectivePrivileges.Response> {
        const { account, realm } = props;
        const privileges = await this.projectionCacheService.collectPermissions({ account, realm });
        return { privileges };
    }
}
