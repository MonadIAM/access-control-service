import { ListEffectivePrivilegesRequest, ListEffectivePrivilegesResponse } from "@monadiam/shared";
import { Controller, Inject } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";

import { PROJECTION_CACHE_SERVICE } from "~context/infrastructure/services/tokens";

@Controller()
export class AccessControlController {
    public constructor(
        @Inject(PROJECTION_CACHE_SERVICE)
        private readonly projectionCacheService: InfrastructureServices.ProjectionCache.Contract,
    ) {}

    @GrpcMethod("AccessControlService", "ListEffectivePrivileges")
    public async listEffectivePrivileges(props: ListEffectivePrivilegesRequest): Promise<ListEffectivePrivilegesResponse> {
        const { account, realm } = props;
        const privileges = await this.projectionCacheService.collectPermissions({ account, realm });
        return { privileges };
    }
}
