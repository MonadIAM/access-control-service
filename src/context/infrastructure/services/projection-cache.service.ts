import { Inject, Injectable } from "@nestjs/common";

import { SystemRealm } from "~infrastructure/datasets/system/realm.dataset";

import { SCRIPT_EXECUTOR_SERVICE } from "./tokens";
import { ProjectionScript } from "../scripts";

@Injectable()
export class ProjectionCacheService implements InfrastructureServices.ProjectionCache.Contract {
    public constructor(
        @Inject(SCRIPT_EXECUTOR_SERVICE)
        private readonly scriptExecutorService: InfrastructureServices.ScriptExecutor.Contract,
    ) {}

    public async checkPermissions(props: InfrastructureServices.ProjectionCache.CheckPermissions): Promise<boolean> {
        return Boolean(
            await this.scriptExecutorService.execute<number>(ProjectionScript.PERMISSION_CHECK, [
                JSON.stringify({
                    permissionRealm: SystemRealm.id,
                    permissions: props.permissions,
                    systemRealm: SystemRealm.id,
                    account: props.account,
                    realm: props.realm,
                }),
            ]),
        );
    }

    public async collectPermissions(
        props: InfrastructureServices.ProjectionCache.CollectPermissions,
    ): Promise<Record<string, string>> {
        return JSON.parse(
            await this.scriptExecutorService.execute<string>(ProjectionScript.PERMISSION_COLLECT, [
                JSON.stringify({
                    permissionRealm: SystemRealm.id,
                    systemRealm: SystemRealm.id,
                    account: props.account,
                    realm: props.realm,
                }),
            ]),
        );
    }

    public async checkRealm(props: InfrastructureServices.ProjectionCache.CheckRealm): Promise<boolean> {
        return JSON.parse(
            await this.scriptExecutorService.execute<string>(ProjectionScript.REALM_COLLECT, [
                JSON.stringify({ account: props.account, realm: props.realm }),
            ]),
        );
    }

    public async collectRealms(props: InfrastructureServices.ProjectionCache.CollectRealms): Promise<string[]> {
        return JSON.parse(
            await this.scriptExecutorService.execute<string>(ProjectionScript.REALM_COLLECT, [
                JSON.stringify({ account: props.account }),
            ]),
        );
    }
}
