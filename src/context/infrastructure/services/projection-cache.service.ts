import { Inject, Injectable } from "@nestjs/common";
import { SYSTEM_REALM_ID } from "@monadiam/shared";

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
        const args: Scripts.Permission.Check.Props = {
            permissionRealm: SYSTEM_REALM_ID,
            permissions: props.permissions,
            globalOnly: props.globalOnly,
            systemRealm: SYSTEM_REALM_ID,
            account: props.account,
            realm: props.realm,
        };

        return JSON.parse(
            await this.scriptExecutorService.execute<string>({
                script: ProjectionScript.PERMISSION_CHECK,
                args: [JSON.stringify(args)],
            }),
        );
    }

    public async collectPermissions(
        props: InfrastructureServices.ProjectionCache.CollectPermissions.Props,
    ): InfrastructureServices.ProjectionCache.CollectPermissions.Result {
        const args: Scripts.Permission.Collect.Props = {
            permissionRealm: SYSTEM_REALM_ID,
            systemRealm: SYSTEM_REALM_ID,
            account: props.account,
            realms: props.realms,
        };

        return JSON.parse(
            await this.scriptExecutorService.execute<string>({
                script: ProjectionScript.PERMISSION_COLLECT,
                args: [JSON.stringify(args)],
            }),
        );
    }

    public async validateAssignments(
        props: InfrastructureServices.ProjectionCache.ValidateAssignments.Props,
    ): InfrastructureServices.ProjectionCache.ValidateAssignments.Result {
        const args: Scripts.AccountRoleAssignment.Validate.Props = { items: props.items };

        return JSON.parse(
            await this.scriptExecutorService.execute<string>({
                script: ProjectionScript.ACCOUNT_ROLE_ASSIGNMENT_VALIDATE,
                args: [JSON.stringify(args)],
            }),
        );
    }

    public async checkRealm(
        props: InfrastructureServices.ProjectionCache.CheckRealm.Props,
    ): InfrastructureServices.ProjectionCache.CheckRealm.Result {
        const args: Scripts.Realm.Check.Props = { account: props.account, realm: props.realm };

        return JSON.parse(
            await this.scriptExecutorService.execute<string>({
                script: ProjectionScript.REALM_CHECK,
                args: [JSON.stringify(args)],
            }),
        );
    }

    public async collectRealms(
        props: InfrastructureServices.ProjectionCache.CollectRealms.Props,
    ): InfrastructureServices.ProjectionCache.CollectRealms.Result {
        const args: Scripts.Realm.Collect.Props = { account: props.account };

        return JSON.parse(
            await this.scriptExecutorService.execute<string>({
                script: ProjectionScript.REALM_COLLECT,
                args: [JSON.stringify(args)],
            }),
        );
    }
}
