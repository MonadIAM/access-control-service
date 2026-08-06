import { Inject, Injectable } from "@nestjs/common";

import { SystemRealm } from "~infrastructure/datasets/realm.dataset";

import { SCRIPT_EXECUTOR_SERVICE } from "./tokens";
import { ProjectionScript } from "../scripts";

@Injectable()
export class ProjectionCacheService implements InfrastructureServices.ProjectionCache.Contract {
    public constructor(
        @Inject(SCRIPT_EXECUTOR_SERVICE)
        private readonly scriptExecutorService: InfrastructureServices.ScriptExecutor.Contract,
    ) {}

    public async checkPermissions(
        props: InfrastructureServices.ProjectionCache.CheckPermissions.Props,
    ): InfrastructureServices.ProjectionCache.CheckPermissions.Result {
        return JSON.parse(
            await this.scriptExecutorService.execute<string>({
                script: ProjectionScript.PERMISSION_CHECK,
                args: [
                    JSON.stringify({
                        permissionRealm: SystemRealm.id,
                        permissions: props.permissions,
                        globalOnly: props.globalOnly,
                        systemRealm: SystemRealm.id,
                        account: props.account,
                        realm: props.realm,
                    }),
                ],
            }),
        );
    }

    public async collectPermissions(
        props: InfrastructureServices.ProjectionCache.CollectPermissions.Props,
    ): InfrastructureServices.ProjectionCache.CollectPermissions.Result {
        return JSON.parse(
            await this.scriptExecutorService.execute<string>({
                script: ProjectionScript.PERMISSION_COLLECT,
                args: [
                    JSON.stringify({
                        permissionRealm: SystemRealm.id,
                        systemRealm: SystemRealm.id,
                        account: props.account,
                        realm: props.realm,
                    }),
                ],
            }),
        );
    }

    public async validateAssignments(
        props: InfrastructureServices.ProjectionCache.ValidateAssignments.Props,
    ): InfrastructureServices.ProjectionCache.ValidateAssignments.Result {
        return JSON.parse(
            await this.scriptExecutorService.execute<string>({
                script: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_VALIDATE,
                args: [JSON.stringify({ items: props.items })],
            }),
        );
    }

    public async checkRealm(
        props: InfrastructureServices.ProjectionCache.CheckRealm.Props,
    ): InfrastructureServices.ProjectionCache.CheckRealm.Result {
        return JSON.parse(
            await this.scriptExecutorService.execute<string>({
                args: [JSON.stringify({ account: props.account, realm: props.realm })],
                script: ProjectionScript.REALM_COLLECT,
            }),
        );
    }

    public async collectRealms(
        props: InfrastructureServices.ProjectionCache.CollectRealms.Props,
    ): InfrastructureServices.ProjectionCache.CollectRealms.Result {
        return JSON.parse(
            await this.scriptExecutorService.execute<string>({
                args: [JSON.stringify({ account: props.account })],
                script: ProjectionScript.REALM_COLLECT,
            }),
        );
    }
}
