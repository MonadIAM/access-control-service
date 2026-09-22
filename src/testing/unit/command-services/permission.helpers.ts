import { jest } from "@jest/globals";

import { PermissionCommands } from "~context/application/commands/permission.commands";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class PermissionCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Commands.Permission.Contract
{
    public commands(): Unit.Commands.Permission.Commands.Result {
        const execution = this.execution();

        const service = {
            restore: jest.fn<Services.Permission.Restore.Signature>(),
            create: jest.fn<Services.Permission.Create.Signature>(),
            update: jest.fn<Services.Permission.Update.Signature>(),
            revoke: jest.fn<Services.Permission.Revoke.Signature>(),
            purge: jest.fn<Services.Permission.Purge.Signature>(),
        };

        return {
            ...execution,
            service,
            commands: new PermissionCommands(
                execution.transactional,
                this.contract<Services.Permission.CommandContract>(service),
            ),
        };
    }
}
