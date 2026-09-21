import { jest } from "@jest/globals";

import { PermissionCommands } from "~context/application/commands/permission.commands";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class PermissionCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Application.PermissionCommands.Contract
{
    public commands(): Unit.Application.PermissionCommands.Commands.Result {
        const execution = this.execution();

        const service = {
            create: jest.fn<Services.Permission.Create.Signature>(),
            update: jest.fn<Services.Permission.Update.Signature>(),
            revoke: jest.fn<Services.Permission.Revoke.Signature>(),
            restore: jest.fn<Services.Permission.Restore.Signature>(),
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
