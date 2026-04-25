import { OnEvent } from "@nestjs/event-emitter";
import { Inject, Injectable } from "@nestjs/common";

import { PERMISSION_CACHE_SERVICE } from "~context/infrastructure/services";
import {
    AccountRoleAssignmentRestoredEvent,
    AccountRoleAssignmentCreatedEvent,
    AccountRoleAssignmentRevokedEvent,
    PermissionOverrideRestoredEvent,
    PermissionOverrideCreatedEvent,
    PermissionOverrideRevokedEvent,
} from "~context/application/events";

@Injectable()
export class PermissionCacheDirectInvalidationHandler {
    public constructor(
        @Inject(PERMISSION_CACHE_SERVICE)
        private readonly permissionCacheService: InfrastructureServices.PermissionCache.Contract,
    ) {}

    @OnEvent(PermissionOverrideCreatedEvent.TOKEN)
    @OnEvent(PermissionOverrideRevokedEvent.TOKEN)
    @OnEvent(PermissionOverrideRestoredEvent.TOKEN)
    @OnEvent(AccountRoleAssignmentCreatedEvent.TOKEN)
    @OnEvent(AccountRoleAssignmentRevokedEvent.TOKEN)
    @OnEvent(AccountRoleAssignmentRestoredEvent.TOKEN)
    public async handle(event: { affectedAccounts: string[] }): Promise<void> {
        await this.permissionCacheService.invalidate({
            accounts: event.affectedAccounts,
        });
    }
}
