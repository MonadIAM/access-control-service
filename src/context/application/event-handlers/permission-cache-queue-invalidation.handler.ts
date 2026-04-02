import { Inject, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { PERMISSION_CACHE_INVALIDATION_QUEUE } from "~context/infrastructure/queues";
import {
    RolePermissionAssignmentRestoredEvent,
    RolePermissionAssignmentCreatedEvent,
    RolePermissionAssignmentRevokedEvent,
    PermissionRestoredEvent,
    PermissionRevokedEvent,
    RoleRestoredEvent,
    RoleRevokedEvent,
} from "~context/application/events";

@Injectable()
export class PermissionCacheQueueInvalidationHandler {
    public constructor(
        @Inject(PERMISSION_CACHE_INVALIDATION_QUEUE)
        private readonly permissionCacheInvalidationQueue: Queues.PermissionInvalidation.Contract,
    ) {}

    @OnEvent(RoleRevokedEvent.TOKEN)
    @OnEvent(RoleRestoredEvent.TOKEN)
    @OnEvent(PermissionRevokedEvent.TOKEN)
    @OnEvent(PermissionRestoredEvent.TOKEN)
    @OnEvent(RolePermissionAssignmentCreatedEvent.TOKEN)
    @OnEvent(RolePermissionAssignmentRevokedEvent.TOKEN)
    @OnEvent(RolePermissionAssignmentRestoredEvent.TOKEN)
    public async handle(event: { affectedAccounts: string[] }): Promise<void> {
        await this.permissionCacheInvalidationQueue.add({
            accounts: event.affectedAccounts,
        });
    }
}
