import { jest } from "@jest/globals";

import { RoleCommands } from "~context/application/commands/role.commands";

import { ApplicationCommandUnitHelpers } from "./core.helpers";

export class RoleCommandsUnitHelpers
    extends ApplicationCommandUnitHelpers
    implements Unit.Application.RoleCommands.Contract
{
    public commands(): Unit.Application.RoleCommands.Commands.Result {
        const execution = this.execution();

        const service = {
            create: jest.fn<Services.Role.Create.Signature>(),
            update: jest.fn<Services.Role.Update.Signature>(),
            move: jest.fn<Services.Role.Move.Signature>(),
            revoke: jest.fn<Services.Role.Revoke.Signature>(),
            restore: jest.fn<Services.Role.Restore.Signature>(),
            purge: jest.fn<Services.Role.Purge.Signature>(),
            purgeSubtree: jest.fn<Services.Role.PurgeSubtree.Signature>(),
        };

        return {
            ...execution,
            service,
            commands: new RoleCommands(execution.transactional, this.contract<Services.Role.CommandContract>(service)),
        };
    }
}
