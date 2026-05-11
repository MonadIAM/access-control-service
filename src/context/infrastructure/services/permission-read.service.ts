import { Inject, Injectable } from "@nestjs/common";

import { SystemRealm } from "~infrastructure/datasets/system/realm.dataset";

import { SCRIPT_EXECUTOR_SERVICE } from "./tokens";
import { ProjectionScript } from "../scripts";

@Injectable()
export class PermissionCacheService implements InfrastructureServices.PermissionCache.Contract {
    public constructor(
        @Inject(SCRIPT_EXECUTOR_SERVICE)
        private readonly scriptExecutorService: InfrastructureServices.ScriptExecutor.Contract,
    ) {}

    public async check(props: InfrastructureServices.PermissionCache.Check): Promise<boolean> {
        const result = await this.scriptExecutorService.execute<number>(ProjectionScript.PERMISSION_CHECK, [
            JSON.stringify({
                permissionRealm: SystemRealm.id,
                permissions: props.permissions,
                systemRealm: SystemRealm.id,
                account: props.account,
                realm: props.realm,
            }),
        ]);

        return result === 1;
    }
}
