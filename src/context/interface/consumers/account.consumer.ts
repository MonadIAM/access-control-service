import { EventPattern, Payload } from "@nestjs/microservices";
import { Controller, Inject } from "@nestjs/common";

import { ACCOUNT_ROLE_ASSIGNMENT_COMMANDS, PERMISSION_OVERRIDE_COMMANDS } from "~context/application/commands";
import { KafkaTopic } from "~context/enums";

@Controller()
export class AccountConsumer implements Consumers.Account.Contract {
    public constructor(
        @Inject(ACCOUNT_ROLE_ASSIGNMENT_COMMANDS)
        private readonly accountRoleAssignmentCommands: Commands.AccountRoleAssignment.ConsumerContract,
        @Inject(PERMISSION_OVERRIDE_COMMANDS)
        private readonly permissionOverrideCommands: Commands.PermissionOverride.ConsumerContract,
    ) {}

    private readonly handlers: Consumers.Account.Handlers = {
        ACCOUNT_REGISTERED: (payload) => this.handleRegistered(payload),
        ACCOUNT_PURGED: (payload) => this.handlePurged(payload),
    };

    @EventPattern(KafkaTopic.ACCOUNT)
    public async handle(@Payload() message: Consumers.Props): Promise<void> {
        const payload = JSON.parse(message.payload);
        await this.handlers[payload.eventType as keyof Consumers.Account.Handlers]?.(payload);
    }

    private async handleRegistered({ accountId }: Consumers.Account.Register): Promise<void> {
        await this.accountRoleAssignmentCommands.assign({ account: accountId });
    }

    private async handlePurged({ accountId }: Consumers.Account.Purge): Promise<void> {
        await this.accountRoleAssignmentCommands.clean({ account: accountId });
        await this.permissionOverrideCommands.clean({ account: accountId });
    }
}
